const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse, sendMobileOtp } = require("../../helpers");
const {
  VisaType,
  VisaApplication,
  Country,
  VisaDocument,
} = require("../../models");
const { generateUniqueString } = require("../../utils");
const sendInsufficentBalanceMail = require("../helpers/sendInsufficentBalanceEmail");
const sendAdminVisaApplicationEmail = require("../helpers/sendVisaAdminEmail");
const sendApplicationEmail = require("../helpers/sendVisaApplicationEmail");
const sendVisaOrderOtp = require("../helpers/sendVisaOrderEmail");
const sendWalletDeductMail = require("../helpers/sendWalletDeductMail");
const { B2BWallet, B2BTransaction } = require("../models");
const {
  visaApplicationSchema, visaReapplySchema,
} = require("../validations/b2bVisaApplication.schema");

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

      console.log(req.body , "body ")

      const { _, error } = visaApplicationSchema.validate(req.body);
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
            from: "b2bclientvisamarkups",
            let: {
              visaType: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$resellerId", req.reseller._id] },
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
          $lookup: {
            from: "b2bsubagentvisamarkups",
            let: {
              visaType: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$resellerId", req.reseller?.referredBy] },
                      { $eq: ["$visaType", "$$visaType"] },
                    ],
                  },
                },
              },
            ],
            as: "markupSubAgent",
          },
        },

        {
          $set: {
            markupClient: { $arrayElemAt: ["$markupClient", 0] },
            markupSubAgent: { $arrayElemAt: ["$markupSubAgent", 0] },
          },
        },
        {
          $addFields: {
            totalPriceSubAgent: {
              $cond: [
                {
                  $eq: ["$markupSubAgent.markupType", "percentage"],
                },

                {
                  $sum: [
                    "$visaPrice",
                    {
                      $divide: [
                        {
                          $multiply: ["$markupSubAgent.markup", "$visaPrice"],
                        },
                        100,
                      ],
                    },
                  ],
                },

                {
                  $sum: ["$visaPrice", "$markupSubAgent.markup"],
                },
              ],
            },
          },
        },
        {
          $addFields: {
            singleVisaPrice: {
              $cond: [
                {
                  $eq: ["$markupClient.markupType", "percentage"],
                },

                {
                  $sum: [
                    "$totalPriceSubAgent",
                    {
                      $divide: [
                        {
                          $multiply: [
                            "$markupClient.markup",
                            "$totalPriceSubAgent",
                          ],
                        },
                        100,
                      ],
                    },
                  ],
                },

                {
                  $sum: ["$totalPriceSubAgent", "$markupClient.markup"],
                },
              ],
            },
          },
        },
        {
          $addFields: {
            totalAmount: {
              $multiply: ["$singleVisaPrice", noOfTravellers],
            },
          },
        },
        {
          $addFields: {
            subAgentMarkup: {
              $cond: [
                {
                  $eq: ["$markupSubAgent.markupType", "percentage"],
                },
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $multiply: ["$markupSubAgent.markup", "$visaPrice"],
                        },
                        100,
                      ],
                    },
                    noOfTravellers,
                  ],
                },
                {
                  $multiply: ["$markupSubAgent.markup", noOfTravellers],
                },
              ],
            },
          },
        },
        {
          $addFields: {
            resellerMarkup: {
              $cond: [
                {
                  $eq: ["$markupClient.markupType", "percentage"],
                },
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $multiply: [
                            "$markupClient.markup",
                            "$totalPriceSubAgent",
                          ],
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

      console.log(visaTypeList , "visaTypeList")

      let profit =
        (visaTypeList[0].visaPrice - visaTypeList[0].purchaseCost) *
        noOfTravellers;

      let totalAmount =
        visaTypeList[0].totalAmount +
        (visaTypeList[0]?.insurance + visaTypeList[0]?.tax) * noOfTravellers;

      const otp = await sendMobileOtp(countryDetail.phonecode, contactNo);

      // const updatedTravellers = travellers.map((traveller) => {
      //   traveller.amount.push(totalAmount / noOfTravellers);
      //   return traveller;
      // });

      await sendVisaOrderOtp(req.reseller.email, "Visa Application Order Otp", otp);

      const newVisaApplication = new VisaApplication({
        visaType,
        visaPrice: visaTypeList[0].singleVisaPrice || 0,
        totalAmount: totalAmount || 0,
        profit,
        resellerMarkup: visaTypeList[0].resellerMarkup || 0,
        subAgentMarkup: visaTypeList[0].subAgentMarkup || 0,
        email,
        contactNo,
        onwardDate,
        returnDate,
        noOfTravellers,
        travellers,
        otp,
        reseller: req.reseller?._id,
        orderedBy: req.reseller.role,
        referenceNumber: generateUniqueString("B2BVSA"),
      });

      await newVisaApplication.save();

      console.log(newVisaApplication , "newVisaApplication")

      res.status(200).json(newVisaApplication);
    } catch (err) {

      console.log(err , "error")
      sendErrorResponse(res, 500, err);
    }
  },

  completeVisaPaymentOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { otp } = req.body;

      // if (!isValidObjectId(orderId)) {
      //   return sendErrorResponse(res, 400, "invalid order id");
      // }

      console.log(otp )

      const VisaApplicationOrder = await VisaApplication.findOne({
        _id: orderId,
        reseller: req.reseller._id,
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

      if (VisaApplicationOrder.status === "payed") {
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
      

      let reseller = req.reseller
      if (!wallet || wallet.balance < totalAmount) {

        sendInsufficentBalanceMail(reseller)
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

      await VisaApplicationOrder.save();
      
      
     

      res.status(200).json({
        message: "Amount Paided successfully ",
        VisaApplicationOrder,
      });
    } catch (err) {
      console.log(err ,error)
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
      }).populate({
        path: "visaType",
        populate: { path: "visa", populate: { path: "country" } },
      });


      if (!visaApplication) {
        return sendErrorResponse(res, 404, "Visa Application Not Found");
      }

      if (!visaApplication.status === "payed") {
        return sendErrorResponse(
          res,
          404,
          "Visa Application Not Payed"
        );
      }



      if (
        req.files["passportFistPagePhoto"].length !==
        visaApplication.noOfTravellers
      ) {
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
      const supportiveDoc1s = req.files["supportiveDoc1"];
      const supportiveDoc2s = req.files["supportiveDoc2"];

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
          supportiveDoc1: "/" + supportiveDoc1s[i]?.path?.replace(/\\/g, "/"),
          supportiveDoc2: "/" + supportiveDoc2s[i]?.path?.replace(/\\/g, "/"),
        });

        promises.push(
          new Promise((resolve, reject) => {
            visaDocument.save((error, document) => {
              if (error) {
                return reject(error);
              }

              console.log(document, "document");
              console.log("Calll" )

              visaApplication.travellers[i].documents = document._id;
              visaApplication.travellers[i].isStatus = "submitted"
              resolve();
            });
          })
        );
      }

      await Promise.all(promises);

      // visaApplication.isDocumentUplaoded = true;
      // visaApplication.status = "submitted";

      await sendApplicationEmail( req.reseller.email ,visaApplication);
      await sendAdminVisaApplicationEmail( visaApplication);


      await visaApplication.save();

      res.status(200).json({
        visaApplication,
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  completeVisaReapplyDocumentOrder: async (req, res) => {
    try {
      const{travellerId} = req.params
      const {orderId} = req.params
      const { 
      title,
      firstName,
      lastName,
      dateOfBirth,
      expiryDate ,
      country,
      passportNo,
      contactNo,
      email,
      status } = req.body
       

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      if (!isValidObjectId(travellerId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      
     
      // const { _, error } = visaReapplySchema.validate(req.body);
      // if (error) {
      //   return sendErrorResponse(
      //     res,
      //     400,
      //     error.details ? error?.details[0]?.message : error.message
      //   );
      // }

      let parsedDateOfBirth;
      if (dateOfBirth) {
        parsedDateOfBirth = JSON.parse(dateOfBirth);
      }

      let parsedExpiryDate;
      if (dateOfBirth) {
        parsedExpiryDate = JSON.parse(expiryDate);
      }


      

      const visaApplication = await VisaApplication.findOne({
        _id: orderId,
        reseller: req.reseller._id,
      }).populate({
        path: "visaType",
        populate: { path: "visa", populate: { path: "country" } },
      });


      if (!visaApplication) {
        return sendErrorResponse(res, 404, "Visa Application Not Found");
      }
      if (!visaApplication.status === "payed") {
        return sendErrorResponse(
          res,
          404,
          "Visa Application Amount Not Payed"
        );
      }

     

      // if (
      //   req.files["passportFistPagePhoto"].length !==
      //   visaApplication.noOfTravellers
      // ) {
      //   return sendErrorResponse(res, 400, "Please Upload all Documents ");
      // }

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
      const supportiveDoc1s = req.files["supportiveDoc1"];
      const supportiveDoc2s = req.files["supportiveDoc2"];

      const photos = [];
      let promises = [];

      // for (let i = 0; i < passportFirstPagePhotos.length; i++) {
        const visaDocument = new VisaDocument({
          passportFistPagePhoto:
            "/" + passportFirstPagePhotos[0]?.path?.replace(/\\/g, "/"),
          passportLastPagePhoto:
            "/" + passportLastPagePhotos[0]?.path?.replace(/\\/g, "/"),
          passportSizePhoto:
            "/" + passportSizePhotos[0]?.path?.replace(/\\/g, "/"),
          supportiveDoc1: "/" + supportiveDoc1s[0]?.path?.replace(/\\/g, "/"),
          supportiveDoc2: "/" + supportiveDoc2s[0]?.path?.replace(/\\/g, "/"),
        });

        promises.push(
          new Promise((resolve, reject) => {
            visaDocument.save(async (error, document) => {
              if (error) {
                return reject(error);
              }

              console.log(document, "document");

              console.log(parsedExpiryDate ,parsedDateOfBirth , "jjjjj" )

              let upload = await VisaApplication.updateOne(
                {
                  _id: orderId,
                  "travellers._id": travellerId,
                },
                { $set: { 
                 "travellers.$.documents": document._id, 
                "travellers.$.title" : title ,
                "travellers.$.firstName" : firstName,
                "travellers.$.lastName" : lastName,
                "travellers.$.dateOfBirth" : parsedDateOfBirth,
                "travellers.$.expiryDate" : parsedExpiryDate ,
                "travellers.$.country" : country,
                "travellers.$.passportNo" :  passportNo,
                "travellers.$.contactNo" : contactNo,
                "travellers.$.email" : email,
                "travellers.$.isStatus" : status } }
              );

              console.log(upload , "upload")

              resolve();
            });
          })
        );
      // }


      await Promise.all(promises);

      await visaApplication.save();

      res.status(200).json({success : "visa submitted " });

      
    } catch (err) {
      
      console.log(err , "error")
      sendErrorResponse(res, 500, err);


    }
  },

  visaApplicationInvoice : async(req,res)=>{

    try{

      const { orderId } = req.params;

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      const visaApplication = await VisaApplication.findOne({
        _id: orderId,
        reseller: req.reseller._id,
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
  }

  
};
