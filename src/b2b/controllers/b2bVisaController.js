const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse, sendMobileOtp } = require("../../helpers");
const { VisaType, VisaApplication } = require("../../models");
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
                        $eq: ["$markupSubAgent.markupType", "percentage"],
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
                        $eq: ["$markupSubAgent.markupType", "percentage"],
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

        const visaTypeDetails = await Attraction.findOne({
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
        

        const otp = await sendMobileOtp(
            countryDetail.phonecode,
            phoneNumber
        );

        const newVisaApplication = new VisaApplication({
            visaType,
            email,
            contactNo,
            onwardDate,
            returnDate,
            noOfTravellers,
            travellers,

        })

        await newVisaApplication.save()
        

    }catch(err){
        sendErrorResponse(res, 500, err);


    }
  }



};
