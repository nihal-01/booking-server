const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse, sendMobileOtp } = require("../../helpers");
const {
  VisaType,
  VisaApplication,
  Country,
  VisaDocument,
} = require("../../models");
const { generateUniqueString } = require("../../utils");
const { B2BWallet, B2BTransaction } = require("../models");
const {
  visaApplicationSchema,
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

      let profit = (visaTypeList[0].visaPrice - visaTypeList[0].purchaseCost ) * noOfTravellers

      console.log(visaTypeList[0], "visaTypeList[0]");

      const otp = await sendMobileOtp(countryDetail.phonecode, contactNo);

      const newVisaApplication = new VisaApplication({
        visaType,
        visaPrice: visaTypeList[0].singleVisaPrice || 0,
        totalAmount: visaTypeList[0].totalAmount || 0,
        profit ,
        resellerMarkup : visaTypeList[0].resellerMarkup || 0 ,
        subAgentMarkup :visaTypeList[0].subAgentMarkup || 0 ,
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

      res.status(200).json(newVisaApplication);
    } catch (err) {
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
      console.log(visaApplication, "VisaApplication");

      if (req.files.length / 3 !== visaApplication.noOfTravellers) {
        return sendErrorResponse(res, 400, "Please Upload all Documents ");
      }

      async function insertPhotos(numPersons, numPhotos) {
        let persons = [];
        let startIndex = 0;
        let promises = [];
        for (let i = 0; i < numPersons; i++) {
          let person = {};
          for (let j = 0; j < numPhotos; j++) {
            let photoIndex = startIndex + j;
            person[`photo${j + 1}`] =
              "/" + req.files[photoIndex]?.path?.replace(/\\/g, "/");
          }

          console.log(person, "person");
          const visaDocument = new VisaDocument({
            passportFistPagePhoto: person.photo1,
            passportLastPagePhoto: person.photo2,
            passportSizePhoto: person.photo3,
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

          persons.push(person);
          startIndex += numPhotos;
        }

        await Promise.all(promises);
        return persons;
      }

      let persons = await insertPhotos(visaApplication.noOfTravellers, 3);

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
