const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse, sendMobileOtp } = require("../../helpers");
const { VisaType, VisaApplication, Country } = require("../../models");
const { generateUniqueString } = require("../../utils");
const { B2BWallet, B2BTransaction } = require("../models");
const { visaApplicationSchema } = require("../validations/b2bVisaApplication.schema");

module.exports = {

    
  getSingleVisa: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid VisaType id");
      }

      if (req.reseller.role == "reseller") {
        const visaType = await VisaType.aggregate([
          {
            $match: {
              _id: Types.ObjectId(id),
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
        ]);

        console.log(visaType, "visaType");

        res.status(200).json(visaType);
      }else{
        

        console.log(req.reseller , "reseller")
        const visaType = await VisaType.aggregate([
            {
              $match: {
                _id: Types.ObjectId(id),
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
                  totalPrice: {
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
                                $multiply: ["$markupClient.markup", "$totalPriceSubAgent"],
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
          ]);
  
          console.log(visaType, "visaType");
  
          res.status(200).json(visaType);

      }
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  getAllVisa: async (req, res) => {

    try {
    

      if (req.reseller.role == "reseller") {
        const visaType = await VisaType.aggregate([
          {
            $match: {
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
        ]);

        console.log(visaType, "visaType");

        res.status(200).json(visaType);
      }else{
        

        console.log(req.reseller , "reseller")
        const visaType = await VisaType.aggregate([
            {
              $match: {
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
                  totalPrice: {
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
                                $multiply: ["$markupClient.markup", "$totalPriceSubAgent"],
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
          ]);
  
          console.log(visaType, "visaType");
  
          res.status(200).json(visaType);

      }
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },


  applyVisa : async(req,res)=>{
    try{

        const {
            visaType,
            email,
            contactNo,
            onwardDate,
            returnDate,
            noOfTravellers,
            travellers,
            country
        }= req.body

        const { _, error } = visaApplicationSchema.validate(
            req.body
        );
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

        if ( noOfTravellers !==  travellers.length ){
            return sendErrorResponse(res, 400, "PassengerDetails Not Added ");

        }
        const visaTypeList = await VisaType.aggregate([
          {
            $match: {
              _id: visaType,
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
                              $multiply: ["$markupClient.markup", "$totalPriceSubAgent"],
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
        ]);

        console.log(visaTypeList)
        

        const otp = await sendMobileOtp(
            countryDetail.phonecode,
            contactNo,

        );

        const newVisaApplication = new VisaApplication({
            visaType,
            visaPrice : visaTypeList.singleVisaPrice,
            totalAmount : visaTypeList.totalAmount,
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


        })

        await newVisaApplication.save()
        

    }catch(err){
        sendErrorResponse(res, 500, err);


    }
  },

  completeVisaPaymentOrder: async (req, res) => {

    try{

      const { orderId } = req.params;
      const { otp } = req.body;

      if (!isValidObjectId(orderId)) {
          return sendErrorResponse(res, 400, "invalid order id");
      }

      const VisaApplication = await VisaApplication.findOne({
          _id: orderId,
          reseller: req.reseller._id,
      });
      if (!VisaApplication) {
          return sendErrorResponse(
              res,
              404,
              "visa application  not found"
          );
      }

      if (VisaApplication.orderStatus === "paid") {
          return sendErrorResponse(
              res,
              400,
              "sorry, you have already completed this order!"
          );
      }

      if (!VisaApplication.otp || VisaApplication.otp !== Number(otp)) {
          return sendErrorResponse(res, 400, "incorrect otp!");
      }

      let totalAmount = VisaApplication.totalPrice;

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

        wallet.balance -= totalAmount;
            await wallet.save();

            transaction.status = "success";
            await transaction.save();

            VisaApplication.isPayed = true 
            await VisaApplication.save();


            res.status(200).json({
              message: "order successfully placed",
               VisaApplication
          });


    }catch(err){

      sendErrorResponse(res, 500, err);

    }

  },

  completeVisaDocumentOrder : async(req,res)=>{

    try{

      const { orderId } = req.params;
      const {documents} = req.body
      
      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
    }

  //   const VisaApplication = await VisaApplication.findOne({
  //     _id: orderId,
  //     reseller: req.reseller._id,
  // });


  // if ( document.lenght !== VisaApplication.noOfTravellers){
  //   return sendErrorResponse(res, 400, "invalid order id");

  // }
  

  let images = [];
  for (let i = 0; i < req.files?.length; i++) {
      const passportFistPagePhoto = "/" + req.files[i]?.path?.replace(/\\/g, "/");
      const passportLastPagePhoto = "/" + req.files[i]?.path?.replace(/\\/g, "/");

      images.push({passportFistPagePhoto ,passportLastPagePhoto });
  }
  
  res.status(200).json({
    VisaApplication,
    images
});



    }catch(err){

      sendErrorResponse(res, 500, err);

    }
  }





};
