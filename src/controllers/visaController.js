const { isValidObjectId, Types } = require("mongoose");
const crypto = require("crypto");
const { generateUniqueString } = require("../utils");
const { sendMobileOtp, sendEmail, sendErrorResponse } = require("../helpers");
const { B2BWallet, B2BTransaction, VisaType, Country, B2CVisaApplication, B2CTransaction, User, VisaDocument } = require("../models");
const { b2cVisaApplicationSchema, visaOrderCaptureSchema } = require("../validations/b2cVisaApplication.schema");
// const { createOrder, fetchOrder, fetchPayment } = require("../utils/paypal");
const { convertCurrency } = require("../b2b/helpers/currencyHelpers");
const {
    completeOrderAfterPayment,
} = require("../helpers/attractionOrderHelpers");


module.exports = {


  applyVisa: async (req, res) => {
    try {
      const {
        visaType,
        email,
        contactNo,
        onwardDate,
        returnDate,
        noOfTravellers,
        travellers,
        country,
      } = req.body;

      const { _, error } = b2cVisaApplicationSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(
          res,
          400,
          error.details ? error?.details[0]?.message : error.message
        );
      }

      if (!isValidObjectId(visaType)) {
        return sendErrorResponse(res, 400, "Invalid visaType id");
      }

      const visaTypeDetails = await VisaType.findOne({
        _id: visaType,
        isDeleted: false,
      });

      if (!visaTypeDetails) {
        return sendErrorResponse(res, 400, "VisaType Not Found");
      }

      const countryDetail = await Country.findOne({
        isDeleted: false,
        _id: country,
      });
      

      if (onwardDate <= new Date()) {
        return sendErrorResponse(res, 400, "Onward date must be greater than the current date");
      }

      if (returnDate <= new Date()) {
        return sendErrorResponse(res, 400, "Return Date date must be greater than the current date");
      }


      if (!countryDetail) {
        return sendErrorResponse(res, 404, "country not found");
      }


      
      if (Number(noOfTravellers) !== travellers.length) {
        return sendErrorResponse(res, 400, "PassengerDetails Not Added ");
      }


      console.log(visaTypeDetails._id, visaType, "visaTypeDetails");
      const visaTypeList = await VisaType.aggregate([
        {
          $match: {
            _id: visaTypeDetails._id,
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "visas",
            localField: "visa",
            foreignField: "_id",
            as: "visa",
          },
        },
        {
          $lookup: {
            from: "b2cclientvisamarkups",
            let: {
              visaType: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$visaType", "$$visaType"] },
                    ],
                  },
                },
              },
            ],
            as: "markupClient",
          },
        },
       
        {
          $set: {
            markupClient: { $arrayElemAt: ["$markupClient", 0] },
          },
        },
        {
          $addFields: {
            totalPrice: {
              $cond: [
                {
                  $eq: ["$markupClient.markupType", "percentage"],
                },

                {
                  $sum: [
                    "$visaPrice",
                    {
                      $divide: [
                        {
                          $multiply: ["$markupClient.markup", "$visaPrice"],
                        },
                        100,
                      ],
                    },
                  ],
                },

                {
                  $sum: ["$visaPrice", "$markupClient.markup"],
                },
              ],
            },
          },
        },
        {
          $addFields: {
            totalAmount: {
              $multiply: ["$totalPrice", Number(noOfTravellers)],
            },
          },
        },
        {
          $addFields: {
            clientMarkup: {
              $cond: [
                {
                  $eq: ["$markupClient.markupType", "percentage"],
                },
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $multiply: ["$markupClient.markup", "$visaPrice"],
                        },
                        100,
                      ],
                    },
                    noOfTravellers,
                  ],
                },
                {
                  $multiply: ["$markupClient.markup", Number(noOfTravellers)],
                },
              ],
            },
          },
        },
        
      ]);

      let profit =
        (visaTypeList[0].totalPrice - visaTypeList[0].purchaseCost) *
        Number(noOfTravellers);

        
      let totalAmount =
      visaTypeList[0].totalAmount +
      (visaTypeList[0]?.insurance + visaTypeList[0]?.tax) * Number(noOfTravellers);

      console.log(visaTypeList[0], "visaTypeList[0]");

      let user;
      if (!req.user) {
          if (!isValidObjectId(country)) {
              return sendErrorResponse(res, 400, "Invalid country id");
          }

          const countryDetails = await Country.findOne({
              _id: country,
              isDeleted: false,
          });

          if (!countryDetails) {
              return sendErrorResponse(res, 400, "Country not found");
          }
          
          // console.log(travellers[0].firstName , "travellers[0].firstname")

          
          user = await User.findOne({ email });
          if (!user) {
              const password = crypto.randomBytes(6);
              user = new User({
                  name : travellers[0].firstName,
                  email,
                  phoneNumber :contactNo ,
                  country,
                  password,
              });

              sendEmail(email , "New Account" , `username : ${email} password : ${password}` )

              await user.save();
          }
      }


      let buyer = req.user || user;




      const newVisaApplication = new B2CVisaApplication({
        visaType,
        visaPrice: visaTypeList[0].totalPrice || 0,
        totalAmount:totalAmount || 0,
        profit : profit || 0,
        clientMarkup: visaTypeList[0].clientMarkup || 0,
        email,
        contactNo,
        onwardDate,
        returnDate,
        noOfTravellers,
        travellers,
        user : buyer?._id,
        referenceNumber: generateUniqueString("B2CVSA"),
      });



      await newVisaApplication.save();

      res.status(200).json(newVisaApplication);
    } catch (err) {

      console.log(err , "error")
      sendErrorResponse(res, 500, err);
    }
  },


  

  initiatePayment : async(req,res)=>{

    try {

        const { orderId } = req.params
        const { paymentProcessor} = req.body;
        


        let visaApplication = await B2CVisaApplication.findById(orderId)

        if(!visaApplication){
          return sendErrorResponse(
            res,
            400,
            "Visa Application Not Found"
            );
            
          }

          if(visaApplication.isPayed == true){
            return sendErrorResponse(
              res,
              400,
              "Visa Application Already Payed"
              );
          }


            let totalAmount = visaApplication.totalAmount;

            const newTransaction = new B2CTransaction({
                user: visaApplication.user,
                amount: visaApplication?.totalAmount,
                status: "pending",
                transactionType: "deduct",
                paymentProcessor,
                orderId: visaApplication?._id,
            });
            await newTransaction.save();

            if (paymentProcessor === "paypal") {
                const currency = "USD";
                const totalAmountUSD = await convertCurrency(
                    totalAmount,
                    currency
                );
                console.log(totalAmountUSD);
                const response = await createOrder(totalAmountUSD, currency);

                if (response.statusCode !== 201) {
                    return sendErrorResponse(
                        res,
                        400,
                        "Something went wrong while fetching order! Please try again later"
                    );
                }

                return res.status(200).json(response.result);
            } else if (paymentProcessor === "razorpay") {
                const currency = "INR";
                const totalAmountINR = await convertCurrency(
                    totalAmount,
                    currency
                );
                const options = {
                    amount: totalAmountINR * 100,
                    currency,
                };
                const order = await instance.orders.create(options);
                return res.status(200).json(order);
            } else if (paymentProcessor === "ccavenue") {
                let body = "";
                body += {
                    merchant_id: process.env.CCAVENUE_MERCHANT_ID,
                    order_id: visaApplication?._id,
                    currency: "AED",
                    amount: Number(visaApplication?.totalAmount),
                    redirect_url: `${process.env.SERVER_URL}/api/v1/attractions/orders/ccavenue/capture`,
                    cancel_url: `${process.env.SERVER_URL}/api/v1/attractions/orders/ccavenue/capture`,
                    language: "EN",
                };
                let accessCode = process.env.CCAVENUE_ACCESS_CODE;

                const encRequest = ccav.encrypt(body);
                const formbody =
                    '<form id="nonseamless" method="post" name="redirect" action="https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction"/> <input type="hidden" id="encRequest" name="encRequest" value="' +
                    encRequest +
                    '"><input type="hidden" name="access_code" id="access_code" value="' +
                    accessCode +
                    '"><script language="javascript">document.redirect.submit();</script></form>';

                res.setHeader("Content-Type", "text/html");
                res.write(formbody);
                res.end();
                return;
            } else {
                return sendErrorResponse(res, 400, "Invalid payment processor");
            }
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
  },
  

  capturePayalVisaApplication : async(req,res)=>{
    
    try{

        const { paymentId, orderId } = req.body;

        // const { _, error } = visaOrderCaptureSchema.validate(
        //     req.body
        // );


        // if (error) {
        //     return sendErrorResponse(res, 400, error.details[0].message);
        // }

        if (!isValidObjectId(orderId)) {
            return sendErrorResponse(res, 400, "Invalid order id");
        }

        let visaApplication = await B2CVisaApplication.findById(orderId)
        

        if (!visaApplication) {
          return sendErrorResponse(
              res,
              400,
              "visa application not found!"
          );
      }

      if (visaApplication.status === "submitted") {
        return sendErrorResponse(
            res,
            400,
            "This order already completed, Thank you. Check with our team if you paid multiple times."
        );
    }

        const transaction = await B2CTransaction.findOne({
            paymentOrderId: orderId,
        });

        if (!transaction) {
          const transaction = new B2CTransaction({
              user: visaApplication.user,
              amount: visaApplication?.totalAmount,
              status: "pending",
              transactionType: "deduct",
              paymentProcessor: "paypal",
              orderId: visaApplication?._id,
          });
          await transaction.save();

      }
      
     

        const orderObject = await fetchOrder(orderId);

        if (orderObject.statusCode == "500") {
            transaction.status = "failed";
            await transaction.save();

            return sendErrorResponse(
                res,
                400,
                "Error while fetching order status from paypal. Check with XYZ team if amount is debited from your bank!"
            );
        } else if (orderObject.status !== "COMPLETED") {
            transaction.status = "failed";
            await transaction.save();

            return sendErrorResponse(
                res,
                400,
                "Paypal order status is not Completed. Check with XYZ team if amount is debited from your bank!"
            );
        } else {
            const paymentObject = await fetchPayment(paymentId);

            if (paymentObject.statusCode == "500") {
                transaction.status = "failed";
                await transaction.save();

                return sendErrorResponse(
                    res,
                    400,
                    "Error while fetching payment status from paypal. Check with XYZ team if amount is debited from your bank!"
                );
            } else if (paymentObject.result.status !== "COMPLETED") {
                transaction.status = "failed";
                await transaction.save();

                return sendErrorResponse(
                    res,
                    400,
                    "Paypal payment status is not Completed. Please complete your payment!"
                );
            } 

          }


                transaction.status = "success";
                visaApplication.isPayed = true
                visaApplication.save()
                

                transaction.paymentDetails = paymentObject?.result;
                await transaction.save();

                res.status(200).json({ visaApplication , status : "Transation Success" })

            // }


    
        // }

    }catch(err){

        sendErrorResponse(res, 500, err);

    }
  },


  captureCCAvenueAttractionPayment: async (req, res) => {
    try {
        let ccavEncResponse = "";
        ccavEncResponse += req.body;

        const ccavPOST = qs.parse(ccavEncResponse);
        const encryption = ccavPOST.encResp;
        const ccavResponse = ccav.decrypt(encryption);

        const visaApplication = await B2CVisaApplication.findOne({
            _id: req.body?.order_id,
        });
        if (!visaApplication) {
            return sendErrorResponse(
                res,
                404,
                "visaApplication  not found"
            );
        }

        let pData = "";
        pData = "<table border=1 cellspacing=2 cellpadding=2><tr><td>";
        pData = pData + ccavResponse.replace(/=/gi, "</td><td>");
        pData = pData.replace(/&/gi, "</td></tr><tr><td>");
        pData = pData + "</td></tr></table>";
        const htmlcode =
            '<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Response Handler</title></head><body><center><font size="4" color="blue"><b>Response Page</b></font><br>' +
            pData +
            "</center><br></body></html>";
        res.writeHeader(200, { "Content-Type": "text/html" });
        res.write(htmlcode);
        res.end();
    } catch (err) {
        console.log(err);
        sendErrorResponse(res, 500, err);
    }
},

  captureRazorpayAttractionPayment: async (req, res) => {
    try {
        const {
            razorpay_order_id,
            transactionid,
            razorpay_signature,
            orderId,
        } = req.body;

        if (!isValidObjectId(orderId)) {
            return sendErrorResponse(res, 400, "invalid order id");
        }

        const visaApplication = await B2CVisaApplication.findOne({
            _id: orderId,
        });
        if (!visaApplication) {
            return sendErrorResponse(
                res,
                400,
                "visaApplication order not found!. Please create an order first. Check with our team if amount is debited from your bank!"
            );
        }

        if (visaApplication.isPayed === true) {
            return sendErrorResponse(
                res,
                400,
                "This order already completed, Thank you. Check with our team if you paid multiple times."
            );
        }

        let transaction = await B2CTransaction.findOne({
            paymentProcessor: "razorpay",
            orderId: attractionOrder?._id,
            status: "pending",
        });
        if (!transaction) {
            const newTransaction = new B2CTransaction({
                user: visaApplication.user,
                amount: visaApplication?.totalAmount,
                status: "pending",
                transactionType: "deduct",
                paymentProcessor: "razorpay",
                orderId: visaApplication?._id,
            });
            await newTransaction.save();
        }

        const generated_signature = crypto.createHmac(
            "sha256",
            process.env.RAZORPAY_KEY_SECRET
        );
        generated_signature.update(razorpay_order_id + "|" + transactionid);

        if (generated_signature.digest("hex") !== razorpay_signature) {
            transaction.status = "failed";
            await transaction.save();
            // visaApplication.orderStatus = "failed";
            // await attractionOrder.save();

            return sendErrorResponse(res, 400, "Transaction failed");
        }

        transaction.status = "success";
        await transaction.save();
        visaApplication.isPayed =  true;
        await visaApplication.save();

        

        return res.status(200).json({visaApplication , 
            message: "Transaction Successful",
        });
    } catch (err) {
        sendErrorResponse(res, 400, err);
    }
},

 

  completeVisaDocumentOrder: async (req, res) => {
    try {
      const { orderId } = req.params;

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      const visaApplication = await B2CVisaApplication.findOne({
        _id: orderId,
      });

      if (visaApplication.status === "submitted") {
        return sendErrorResponse(
          res,
          404,
          "Visa Application Already Submitted"
        );
      }

      if (!visaApplication) {
        return sendErrorResponse(res, 404, "visa application  not found");
      }
      
      console.log(visaApplication,req.files["passportFistPagePhoto"].length , "VisaApplication");

      if (req.files["passportFistPagePhoto"].length  !== visaApplication.noOfTravellers) {
        return sendErrorResponse(res, 400, "Please Upload all Documents ");
      }

      // async function insertPhotos(numPersons, numPhotos) {
      //   let persons = [];
      //   let startIndex = 0;
      //   let promises = [];
      //   for (let i = 0; i < numPersons; i++) {
      //     let person = {};
      //     for (let j = 0; j < numPhotos; j++) {
      //       let photoIndex = startIndex + j;
      //       person[`photo${j + 1}`] =
      //         "/" + req.files[photoIndex]?.path?.replace(/\\/g, "/");
      //     }

      //     console.log(person, "person");
      //     const visaDocument = new VisaDocument({
      //       passportFistPagePhoto: person.photo1,
      //       passportLastPagePhoto: person.photo2,
      //       passportSizePhoto: person.photo3,
      //     });

      //     promises.push(
      //       new Promise((resolve, reject) => {
      //         visaDocument.save((error, document) => {
      //           if (error) {
      //             return reject(error);
      //           }

      //           console.log(document, "document");

      //           visaApplication.travellers[i].documents = document._id;
      //           resolve();
      //         });
      //       })
      //     );

      //     persons.push(person);
      //     startIndex += numPhotos;
      //   }

      //   await Promise.all(promises);
      //   return persons;
      // }

      // let persons = await insertPhotos(visaApplication.noOfTravellers, 3);

      const passportFirstPagePhotos = req.files["passportFistPagePhoto"];
      const passportLastPagePhotos = req.files["passportLastPagePhoto"];
      const passportSizePhotos = req.files["passportSizePhoto"];
      const supportiveDoc1s = req.files["supportiveDoc1"]
      const supportiveDoc2s = req.files["supportiveDoc2"]


      const photos = [];
      let promises = [];


      for (let i = 0; i < passportFirstPagePhotos.length; i++) {
        const visaDocument = new VisaDocument({
          passportFistPagePhoto:
            "/" + passportFirstPagePhotos[i]?.path?.replace(/\\/g, "/"),
          passportLastPagePhoto:
            "/" + passportLastPagePhotos[i]?.path?.replace(/\\/g, "/"),
          passportSizePhoto:
            "/" + passportSizePhotos[i]?.path?.replace(/\\/g, "/"),
            supportiveDoc1:
            "/" + supportiveDoc1s[i]?.path?.replace(/\\/g, "/"),
            supportiveDoc2:
            "/" + supportiveDoc2s[i]?.path?.replace(/\\/g, "/"),
        });

        promises.push(
          new Promise((resolve, reject) => {
            visaDocument.save((error, document) => {
              if (error) {
                return reject(error);
              }

              console.log(document, "document");

              visaApplication.travellers[i].documents = document._id;
              resolve();
            });
          })
        );

        
      }

      await Promise.all(promises);


      console.log(visaApplication, "visaApplication");

      visaApplication.isDocumentUplaoded = true;
      visaApplication.status = "submitted";
      await visaApplication.save();

      res.status(200).json({
        visaApplication
      });


    } catch (err) {

      sendErrorResponse(res, 500, err);

    }
  },

  visaApplicationInvoice :async(req,res)=>{

    try{

      const { orderId } = req.params;

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      const visaApplication = await B2CVisaApplication.findOne({
        _id: orderId,
      }).populate({
        path: "visaType",
        populate: { path: "visa", populate: { path: "country" } },
      });

      if (!visaApplication) {
        return sendErrorResponse(res, 404, "visa application  not found");
      }


      res.status(200).json(visaApplication)



    }catch(err){

      sendErrorResponse(res, 500, err);

    }
  },

  visaApplicationList : async(req,res)=>{

    try{

      const visaApplication = await B2CVisaApplication.aggregate([
        {
          $match:{
            user:req.user._id
          },

        },       
          {
            $lookup: {
              from: "visatypes",
              localField: "visaType",
              foreignField: "_id",
              as: "visaType",
            },
          },
          {
            $lookup: {
              from: "visas",
              localField: "visaType.visa",
              foreignField: "_id",
              as: "visa",
            },
          },
          {
            $set: {
              visaType: { $arrayElemAt: ["$visaType.name", 0] },
              visa: { $arrayElemAt: ["$visa.name", 0] },

            },
          },
          {
            $unwind : "$travellers"
          }
          // },{
          //   $project : {
          //     visaType : 1 , visa : 1
          //   }
          // }    
      ])
      

      if (!visaApplication) {
        return sendErrorResponse(res, 404, "visa application  not found");
      }


      res.status(200).json(visaApplication)

    }catch(err){
       
      sendErrorResponse(res, 500, err);

    }
  },

  singleVisaApplication : async(req,res)=>{

    try{

      const {orderId , travellerId} = req.params

      
      const visaApplication = await B2CVisaApplication.findOne(
        {
            _id: orderId,
            user : req.user._id,
        },
        { travellers: { $elemMatch: { _id: travellerId } } }
    ).populate("visaType")
      
    

      if (!visaApplication) {
        return sendErrorResponse(res, 404, "visa application  not found");
      }


      res.status(200).json(visaApplication)

    }catch(err){

      sendErrorResponse(res, 500, err);

    }
  }

};
