const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse, sendMobileOtp } = require("../../helpers");
const {
  VisaType,
  VisaApplication,
  Visa,
  Country,
  VisaDocument,
} = require("../../models");

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
      } else {
        console.log(req.reseller, "reseller");
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
        ]);

        console.log(visaType, "visaType");

        res.status(200).json(visaType[0]);
      }
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  getAllVisa: async (req, res) => {
    try {
      // if (req.reseller.role == "reseller") {
      //   const visaType = await VisaType.aggregate([
      //     {
      //       $match: {
      //         isDeleted: false,
      //       },
      //     },
      //     {
      //       $lookup: {
      //         from: "visas",
      //         localField: "visa",
      //         foreignField: "_id",
      //         as: "visa",
      //       },
      //     },
      //     {
      //       $lookup: {
      //         from: "b2bclientvisamarkups",
      //         let: {
      //           visaType: "$_id",
      //         },
      //         pipeline: [
      //           {
      //             $match: {
      //               $expr: {
      //                 $and: [
      //                   { $eq: ["$resellerId", req.reseller._id] },
      //                   { $eq: ["$visaType", "$$visaType"] },
      //                 ],
      //               },
      //             },
      //           },
      //         ],
      //         as: "markupClient",
      //       },
      //     },

      //     {
      //       $set: {
      //         markupClient: { $arrayElemAt: ["$markupClient", 0] },
      //       },
      //     },
      //     {
      //       $addFields: {
      //         totalPrice: {
      //           $cond: [
      //             {
      //               $eq: ["$markupClient.markupType", "percentage"],
      //             },

      //             {
      //               $sum: [
      //                 "$visaPrice",
      //                 {
      //                   $divide: [
      //                     {
      //                       $multiply: ["$markupClient.markup", "$visaPrice"],
      //                     },
      //                     100,
      //                   ],
      //                 },
      //               ],
      //             },

      //             {
      //               $sum: ["$visaPrice", "$markupClient.markup"],
      //             },
      //           ],
      //         },
      //       },
      //     },
      //   ]);

      //   console.log(visaType, "visaType");

      //   res.status(200).json(visaType);
      // }else{

      console.log(req.reseller, "reseller");
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
        
      ]);

      console.log(visaType, "visaType");

      res.status(200).json(visaType);

      // }
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  listAll: async (req, res) => {
    try {
      console.log(req.reseller, "reseller");
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
            from: "b2bspecialvisamarkups",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$resellerId",
                          {
                            $cond: {
                              if: { $eq: [req.reseller.role, "sub-agent"] },
                              then: req.reseller?.referredBy,
                              else: req.reseller?._id,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: "specialMarkup",
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
                      { $eq: ["$resellerId", req.reseller._id] },
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
          $lookup: {
            from: "countries",
            localField: "visa.country",
            foreignField: "_id",
            as: "country",
          },
        },

        {
          $set: {
            visa: { $arrayElemAt: ["$country.countryName", 0] },
            markupClient: { $arrayElemAt: ["$markupClient", 0] },
            markupSubAgent: { $arrayElemAt: ["$markupSubAgent", 0] },
            specialMarkup : { $arrayElemAt: ["$specialMarkup", 0] }
          },
        },
        {
          $addFields: {
            totalspecialPrice: {
              $cond: [
                {
                  $eq: ["$specialMarkup.markupType", "percentage"],
                },

                {
                  $sum: [
                    "$visaPrice",
                    {
                      $divide: [
                        {
                          $multiply: ["$specialMarkup.markup", "$visaPrice"],
                        },
                        100,
                      ],
                    },
                  ],
                },

                {
                  $sum: ["$visaPrice", "$specialMarkup.markup"],
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
                    "$totalspecialPrice",
                    {
                      $divide: [
                        {
                          $multiply: [
                            "$markupSubAgent.markup",
                            "$totalspecialPrice",
                          ],
                        },
                        100,
                      ],
                    },
                  ],
                },

                {
                  $sum: ["$totalspecialPrice", "$markupSubAgent.markup"],
                },
              ],
            },
          },
        },
      ]);

      if (!visaType) {
        return sendErrorResponse(res, 400, "No visaType Available");
      }
      // const countryDetails = await Country.findById(country);

      console.log(visaType, "visaType");

      res.status(200).json(visaType);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  listAllCountry: async (req, res) => {
    try {
      const visaCountry = await Visa.find({ isDeleted: false }).populate({
        path: "country",
        select: "countryName",
      });

      if (!visaCountry) {
        return sendErrorResponse(res, 400, "No Visa Available");
      }

      res.status(200).json(visaCountry);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  listVisaType: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid VisaType id");
      }

      let visa = await Visa.findOne({ _id: id, isDeleted: false }).populate(
        "country"
      );

      if (!visa) {
        return sendErrorResponse(res, 400, "No Visa ");
      }

      const visaType = await VisaType.aggregate([
        {
          $match: {
            visa: Types.ObjectId(id),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "b2bspecialvisamarkups",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$resellerId",
                          {
                            $cond: {
                              if: { $eq: [req.reseller.role, "sub-agent"] },
                              then: req.reseller?.referredBy,
                              else: req.reseller?._id,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: "specialMarkup",
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
            specialMarkup: { $arrayElemAt: ["$specialMarkup", 0] },
          },
        },
        {
          $addFields: {
            totalspecialPrice: {
              $cond: [
                {
                  $eq: ["$specialMarkup.markupType", "percentage"],
                },

                {
                  $sum: [
                    "$visaPrice",
                    {
                      $divide: [
                        {
                          $multiply: ["$specialMarkup.markup", "$visaPrice"],
                        },
                        100,
                      ],
                    },
                  ],
                },

                {
                  $sum: ["$visaPrice", "$specialMarkup.markup"],
                },
              ],
            },
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
                    "$totalspecialPrice",
                    {
                      $divide: [
                        {
                          $multiply: [
                            "$markupSubAgent.markup",
                            "$totalspecialPrice",
                          ],
                        },
                        100,
                      ],
                    },
                  ],
                },

                {
                  $sum: ["$totalspecialPrice", "$markupSubAgent.markup"],
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
      ]);

      if (!visaType) {
        return sendErrorResponse(res, 400, "No visaType ");
      }

      console.log(visaType, visa, "visaType");

      res.status(200).json({
        visa,
        visaType,
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },
};
