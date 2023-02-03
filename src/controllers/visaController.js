const { isValidObjectId, Types } = require("mongoose");

const { generateUniqueString } = require("../../utils");
const { sendMobileOtp } = require("../helpers");
const { B2BWallet, B2BTransaction, VisaType, Country, B2CVisaApplication, B2CTransaction, User } = require("../models");
const { b2cVisaApplicationSchema } = require("../validations/b2cVisaApplication.schema");


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


      if (!countryDetail) {
        return sendErrorResponse(res, 404, "country not found");
      }

      if (noOfTravellers !== travellers.length) {
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
              $multiply: ["$totalPrice", noOfTravellers],
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
                  $multiply: ["$markupClient.markup", noOfTravellers],
                },
              ],
            },
          },
        },
        
      ]);

      let profit =
        (visaTypeList[0].totalPrice - visaTypeList[0].purchaseCost) *
        noOfTravellers;

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

          user = await User.findOne({ email });
          if (!user) {
              const password = crypto.randomBytes(6);
              user = new User({
                  name,
                  email,
                  phoneNumber,
                  country,
                  password,
              });
              await user.save();
          }
      }
      
      const newVisaApplication = new B2CVisaApplication({
        visaType,
        visaPrice: visaTypeList[0].singleVisaPrice || 0,
        totalAmount: visaTypeList[0].totalAmount || 0,
        profit,
        clientMarkup: visaTypeList[0].clientMarkup || 0,
        email,
        contactNo,
        onwardDate,
        returnDate,
        noOfTravellers,
        travellers,
        otp,
        referenceNumber: generateUniqueString("B2CVSA"),
      });

      await newVisaApplication.save();

      res.status(200).json(newVisaApplication);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },


  initiatePayment : async(req,res)=>{

    try {
        const { paymentProcessor, id } = req.body;

        const newTransation = new B2CTransaction({
            transactionType: "deposit",
            amount,
            paymentProcessor,
            status: "pending",
        });

        let resultFinal;
        if (paymentProcessor === "paypal") {
            const currency = "USD";
            const response = await createOrder(amount, currency);

            newTransation.paymentOrderId = response.result.id;
            resultFinal = response.result;

            if (response.statusCode !== 201) {
                newTransation.status = "failed";
                await newTransation.save();

                return sendErrorResponse(
                    res,
                    400,
                    "Something went wrong while fetching order! Please try again later"
                );
            }
        } else if (paymentProcessor === "razorpay") {
        } else {
            return sendErrorResponse(
                res,
                400,
                "Invalid payment processor. Please select a valid one"
            );
        }

        await newTransation.save();
        res.status(200).json(resultFinal);
    } catch (err) {
        // handle transaction fail here
        sendErrorResponse(res, 500, err);
    }
  },


  completeVisaPaymentOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { otp } = req.body;

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      const VisaApplicationOrder = await B2CVisaApplication.findOne({
        _id: orderId,
      });

      if (!VisaApplicationOrder) {
        return sendErrorResponse(res, 404, "visa application  not found");
      }

      // if (VisaApplicationOrder.onwardDate <= new Date) {
      //     return sendErrorResponse(
      //         res,
      //         400,
      //         "sorry, visa onward date if experied!"
      //     );
      // }

      if (VisaApplicationOrder.isPayed === true) {
        return sendErrorResponse(
          res,
          400,
          "sorry, you have already completed this order!"
        );
      }

      if (
        !VisaApplicationOrder.otp ||
        VisaApplicationOrder.otp !== Number(otp)
      ) {
        return sendErrorResponse(res, 400, "incorrect otp!");
      }

      let totalAmount = VisaApplicationOrder.totalAmount;

      let wallet = await B2BWallet.findOne({
        reseller: req.reseller?._id,
      });

      if (!wallet || wallet.balance < totalAmount) {
        return sendErrorResponse(
          res,
          400,
          "insufficient balance. please reacharge and try again"
        );
      }

      const transaction = new B2BTransaction({
        reseller: req.reseller?._id,
        transactionType: "deduct",
        status: "pending",
        paymentProcessor: "wallet",
        amount: totalAmount,
        order: orderId,
      });

      console.log(totalAmount, "totalAmount");

      wallet.balance -= totalAmount;
      await wallet.save();

      transaction.status = "success";
      await transaction.save();

      VisaApplicationOrder.isPayed = true;
      await VisaApplicationOrder.save();

      res.status(200).json({
        message: "Amount Paided successfully ",
        VisaApplicationOrder,
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  completeVisaDocumentOrder: async (req, res) => {
    try {
      const { orderId } = req.params;

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      const visaApplication = await VisaApplication.findOne({
        _id: orderId,
        reseller: req.reseller._id,
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
        visaApplication,
      });


    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },
};
