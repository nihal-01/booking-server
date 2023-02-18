const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Attraction, Destination, AttractionTicket } = require("../../models");

module.exports = {
  getSingleAttraction: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid attraction id");
      }

      const attraction = await Attraction.aggregate([
        {
          $match: {
            _id: Types.ObjectId(id),
            isDeleted: false,
            isActive: true,
          },
        },
        {
          $lookup: {
            from: "destinations",
            localField: "destination",
            foreignField: "_id",
            as: "destination",
          },
        },
        {
          $lookup: {
            from: "attractioncategories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "attractionreviews",
            localField: "_id",
            foreignField: "attraction",
            as: "reviews",
          },
        },
        {
          $lookup: {
            from: "b2bspecialattractionmarkups",
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
                              if: {
                                $eq: [req.reseller.role, "sub-agent"],
                              },
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
            from: "b2bclientattractionmarkups",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$resellerId", req.reseller._id],
                      },
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
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
            from: "b2bsubagentattractionmarkups",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$resellerId", req?.reseller.referredBy],
                      },
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
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
            destination: { $arrayElemAt: ["$destination", 0] },
            category: { $arrayElemAt: ["$category", 0] },
            markupSubAgent: {
              $arrayElemAt: ["$markupSubAgent", 0],
            },
            markupClient: {
              $arrayElemAt: ["$markupClient", 0],
            },
            specialMarkup: { $arrayElemAt: ["$specialMarkup", 0] },

            totalRating: {
              $sum: {
                $map: {
                  input: "$reviews",
                  in: "$$this.rating",
                },
              },
            },
            totalReviews: {
              $size: "$reviews",
            },
          },
        },
        {
          $set: {
            averageRating: {
              $cond: [
                { $eq: ["$totalReviews", 0] },
                0,
                {
                  $divide: ["$totalRating", "$totalReviews"],
                },
              ],
            },
          },
        },

        {
          $lookup: {
            from: "attractionactivities",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
                      { $eq: ["$isDeleted", false] },
                    ],
                  },
                },
              },
              {
                $addFields: {
                  privateTransfer: {
                    $arrayElemAt: ["$privateTransfers", 0],
                  },
                },
              },
              {
                $addFields: {
                  lowPrice: {
                    $cond: {
                      if: {
                        $eq: ["$activityType", "normal"],
                      },
                      then: "$adultPrice",
                      else: {
                        $cond: {
                          if: {
                            $eq: ["$isSharedTransferAvailable", true],
                          },
                          then: "$sharedTransferPrice",
                          else: "$privateTransfer.price",
                        },
                      },
                    },
                  },
                },
              },
              {
                $sort: { adultPrice: 1 },
              },
              {
                $lookup: {
                  from: "attractiontickets",
                  let: { activityId: "$_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$activity", "$$activityId"] },
                            { $eq: ["$status", "ok"] },
                          ],
                        },
                      },
                    },
                    {
                      $group: {
                        _id: "$ticketFor",
                        count: { $sum: 1 },
                      },
                    },
                  ],
                  as: "ticketCounts",
                },
              },
              {
                $addFields: {
                  ticketCounts: {
                    $filter: {
                      input: "$ticketCounts",
                      as: "item",
                      cond: { $ne: ["$$item._id", null] },
                    },
                  },
                },
              },
              {
                $addFields: {
                  ticketCounts: {
                    $arrayToObject: {
                      $map: {
                        input: "$ticketCounts",
                        in: {
                          k: { $toString: "$$this._id" },
                          v: "$$this.count",
                        },
                      },
                    },
                  },
                },
              },
              // {
              //   $addFields: {
              //     childTicketCount: {
              //       $cond: {
              //         if: { $isArray: "$ticketCounts.child" },
              //         then: { $arrayElemAt: ["$ticketCounts.child", 0] },
              //         else: 0,
              //       },
              //     },
              //     adultTicketCount: {
              //       $cond: {
              //         if: { $isArray: "$ticketCounts.adult" },
              //         then: { $arrayElemAt: ["$ticketCounts.adult", 0] },
              //         else: 0,
              //       },
              //     },
              //     infantTicketCount: {
              //       $cond: {
              //         if: { $isArray: "$ticketCounts.infant" },
              //         then: { $arrayElemAt: ["$ticketCounts.infant", 0] },
              //         else: 0,
              //       },
              //     },
              //     commonTicketCount: {
              //       $cond: {
              //         if: { $isArray: "$ticketCounts.common" },
              //         then: { $arrayElemAt: ["$ticketCounts.common", 0] },
              //         else: 0,
              //       },
              //     },
              //   },
              // },
              {
                $addFields: {
                  childTicketCount: { $ifNull: ["$ticketCounts.child", 0] },
                  adultTicketCount: { $ifNull: ["$ticketCounts.adult", 0] },
                  infantTicketCount: { $ifNull: ["$ticketCounts.infant", 0] },
                  commonTicketCount: { $ifNull: ["$ticketCounts.common", 0] },
                },
              },
              {
                $project: { ticketCounts: 0 },
              },
            ],
            as: "activities",
          },
        },

        // {
        //   $lookup: {
        //     from: "attractionactivities",
        //     let: {
        //       attraction: "$_id",
        //     },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: {
        //             $and: [
        //               {
        //                 $eq: ["$attraction", "$$attraction"],
        //               },
        //               { $eq: ["$isDeleted", false] },
        //             ],
        //           },
        //         },
        //       },
        //       {
        //         $addFields: {
        //           privateTransfer: {
        //             $arrayElemAt: ["$privateTransfers", 0],
        //           },
        //         },
        //       },
        //       {
        //         $addFields: {
        //           lowPrice: {
        //             $cond: {
        //               if: {
        //                 $eq: ["$activityType", "normal"],
        //               },
        //               then: "$adultPrice",
        //               else: {
        //                 $cond: {
        //                   if: {
        //                     $eq: ["$isSharedTransferAvailable", true],
        //                   },
        //                   then: "$sharedTransferPrice",
        //                   else: "$privateTransfer.price",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //       {
        //         $sort: { adultPrice: 1 },
        //       },
        //       {
        //         $lookup: {
        //           from: "attractiontickets",
        //           let: { activityId: "$_id" },
        //           pipeline: [
        //             {
        //               $match: {
        //                 $expr: {
        //                   $and: [
        //                     { $eq: ["$activity", "$$activityId"] },
        //                     { $eq: ["$status", "ok"] },
        //                   ],
        //                 },
        //               },
        //             },
        //             {
        //               $count: "ticketCount",
        //             },
        //           ],
        //           as: "ticketCounts",
        //         },
        //       },
        //       {
        //         $addFields: {
        //           ticketCount: {
        //             $ifNull: [
        //               { $arrayElemAt: ["$ticketCounts.ticketCount", 0] },
        //               0,
        //             ],
        //           },
        //         },
        //       },
        //       {
        //         $project: { ticketCounts: 0 },
        //       },
        //     ],
        //     as: "activities",
        //   },
        // },

        {
          $addFields: {
            activitiesSpecial: {
              $map: {
                input: "$activities",
                as: "activity",
                in: {
                  $cond: [
                    {
                      $eq: ["$$activity.activityType", "normal"],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$specialMarkup.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.adultPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              childPrice: {
                                $sum: [
                                  "$$activity.childPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.childPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              infantPrice: {
                                $cond: [
                                  {
                                    $eq: ["$$activity.infantPrice", 0],
                                  },
                                  0,
                                  {
                                    $sum: [
                                      "$$activity.infantPrice",
                                      {
                                        $divide: [
                                          {
                                            $multiply: [
                                              "$specialMarkup.markup",
                                              "$$activity.infantPrice",
                                            ],
                                          },
                                          100,
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                              childPrice: {
                                $sum: [
                                  "$$activity.childPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                              infantPrice: {
                                $cond: [
                                  {
                                    $or: [
                                      { $eq: ["$$activity.infantPrice", null] },
                                      { $eq: ["$$activity.infantPrice", 0] },
                                    ],
                                  },
                                  0,
                                  {
                                    $sum: [
                                      "$$activity.infantPrice",
                                      "$specialMarkup.markup",
                                    ],
                                  },
                                ],
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$specialMarkup.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.sharedTransferPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    price: {
                                      $sum: [
                                        "$$transfers.price",
                                        {
                                          $divide: [
                                            {
                                              $multiply: [
                                                "$specialMarkup.markup",
                                                "$$transfers.price",
                                              ],
                                            },
                                            100,
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    $mergeObjects: [
                                      "$$transfers",
                                      {
                                        price: {
                                          $sum: [
                                            "$$transfers.price",
                                            "$specialMarkup.markup",
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            activitiesSubAgent: {
              $map: {
                input: "$activitiesSpecial",
                as: "activity",
                in: {
                  $cond: [
                    {
                      $eq: ["$$activity.activityType", "normal"],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupSubAgent.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.adultPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              childPrice: {
                                $sum: [
                                  "$$activity.childPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.childPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              infantPrice: {
                                $cond: [
                                  {
                                    $or: [
                                      { $eq: ["$$activity.infantPrice", null] },
                                      { $eq: ["$$activity.infantPrice", 0] },
                                    ],
                                  },
                                  0,
                                  {
                                    $sum: [
                                      "$$activity.infantPrice",
                                      {
                                        $divide: [
                                          {
                                            $multiply: [
                                              "$markupSubAgent.markup",
                                              "$$activity.infantPrice",
                                            ],
                                          },
                                          100,
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  "$markupSubAgent.markup",
                                ],
                              },
                              childPrice: {
                                $sum: [
                                  "$$activity.childPrice",
                                  "$markupSubAgent.markup",
                                ],
                              },
                              infantPrice: {
                                $cond: [
                                  {
                                    $or: [
                                      { $eq: ["$$activity.infantPrice", null] },
                                      { $eq: ["$$activity.infantPrice", 0] },
                                    ],
                                  },
                                  0,
                                  {
                                    $sum: [
                                      "$$activity.infantPrice",
                                      "$markupSubAgent.markup",
                                    ],
                                  },
                                ],
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupSubAgent.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupSubAgent.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.sharedTransferPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    price: {
                                      $sum: [
                                        "$$transfers.price",
                                        {
                                          $divide: [
                                            {
                                              $multiply: [
                                                "$markupSubAgent.markup",
                                                "$$transfers.price",
                                              ],
                                            },
                                            100,
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  "$markupSubAgent.markup",
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    $mergeObjects: [
                                      "$$transfers",
                                      {
                                        price: {
                                          $sum: [
                                            "$$transfers.price",
                                            "$markupSubAgent.markup",
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupSubAgent.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },

        {
          $addFields: {
            activities: {
              $map: {
                input: "$activitiesSubAgent",
                as: "activity",
                in: {
                  $cond: [
                    {
                      $eq: ["$$activity.activityType", "normal"],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupClient.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupClient.markup",
                                          "$$activity.adultPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              childPrice: {
                                $sum: [
                                  "$$activity.childPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupClient.markup",
                                          "$$activity.childPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              infantPrice: {
                                $cond: [
                                  {
                                    $or: [
                                      { $eq: ["$$activity.infantPrice", null] },
                                      { $eq: ["$$activity.infantPrice", 0] },
                                    ],
                                  },
                                  0,
                                  {
                                    $sum: [
                                      "$$activity.infantPrice",
                                      {
                                        $divide: [
                                          {
                                            $multiply: [
                                              "$markupClient.markup",
                                              "$$activity.infantPrice",
                                            ],
                                          },
                                          100,
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupClient.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  "$markupClient.markup",
                                ],
                              },
                              childPrice: {
                                $sum: [
                                  "$$activity.childPrice",
                                  "$markupClient.markup",
                                ],
                              },
                              infantPrice: {
                                $cond: [
                                  {
                                    $or: [
                                      { $eq: ["$$activity.infantPrice", null] },
                                      { $eq: ["$$activity.infantPrice", 0] },
                                    ],
                                  },
                                  0,
                                  {
                                    $sum: [
                                      "$$activity.infantPrice",
                                      "$markupClient.markup",
                                    ],
                                  },
                                ],
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupClient.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupClient.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupClient.markup",
                                          "$$activity.sharedTransferPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    price: {
                                      $sum: [
                                        "$$transfers.price",
                                        {
                                          $divide: [
                                            {
                                              $multiply: [
                                                "$markupClient.markup",
                                                "$$transfers.price",
                                              ],
                                            },
                                            100,
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupClient.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  "$markupClient.markup",
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    $mergeObjects: [
                                      "$$transfers",
                                      {
                                        price: {
                                          $sum: [
                                            "$$transfers.price",
                                            "$markupClient.markup",
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupClient.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },

        {
          $project: {
            totalReviews: 0,
            activitiesSpecial: 0,
            activitiesSubAgent: 0,
            specialMarkup: 0,
            activities: {
              privateTransfer: 0,
            },
          },
        },
      ]);

      if (!attraction || attraction?.length < 1) {
        return sendErrorResponse(res, 404, "Attraction not found");
      }
      

      
      res.status(200).json({
        attraction: attraction[0],
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  getAllAttractions: async (req, res) => {
    try {
      const { skip = 0, limit = 10, destination, category, search } = req.query;

      const filters1 = { isDeleted: false, isActive: true };

      if (category && category !== "") {
        if (!isValidObjectId(category)) {
          return sendErrorResponse(res, 400, "Invalid category id");
        }

        filters1.category = Types.ObjectId(category);
      }

      if (destination && destination !== "") {
        const dest = await Destination.findOne({
          name: destination?.toLowerCase(),
        });

        if (dest) {
          filters1.destination = dest?._id;
        } else {
          return res.status(200).json({
            destinations: [],
            skip: Number(skip),
            limit: Number(limit),
          });
        }
      }
      console.log(search, "search");

      if (search && search !== "") {
        filters1.title = { $regex: search, $options: "i" };
      }

      const attractions = await Attraction.aggregate([
        { $match: filters1 },
        {
          $lookup: {
            from: "attractionactivities",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
                      { $eq: ["$isDeleted", false] },
                    ],
                  },
                },
              },

              {
                $addFields: {
                  privateTransfer: {
                    $arrayElemAt: ["$privateTransfers", 0],
                  },
                },
              },
              {
                $addFields: {
                  lowPrice: {
                    $cond: {
                      if: {
                        $eq: ["$activityType", "normal"],
                      },
                      then: "$adultPrice",
                      else: {
                        $cond: {
                          if: {
                            $eq: ["$isSharedTransferAvailable", true],
                          },
                          then: "$sharedTransferPrice",
                          else: "$privateTransfer.price",
                        },
                      },
                    },
                  },
                },
              },
              {
                $sort: { adultPrice: 1 },
              },
            ],
            as: "activities",
          },
        },
        {
          $lookup: {
            from: "attractionreviews",
            localField: "_id",
            foreignField: "attraction",
            as: "reviews",
          },
        },
        {
          $lookup: {
            from: "b2bspecialattractionmarkups",
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
                              if: {
                                $eq: [req.reseller.role, "sub-agent"],
                              },
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
            from: "b2bclientattractionmarkups",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$resellerId", req.reseller._id],
                      },
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
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
            from: "b2bsubagentattractionmarkups",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$resellerId", req?.reseller?.referredBy],
                      },
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
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
            from: "destinations",
            localField: "destination",
            foreignField: "_id",
            as: "destination",
          },
        },
        {
          $lookup: {
            from: "attractioncategories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $set: {
            activity: { $arrayElemAt: ["$activities", 0] },
            markupSubAgent: {
              $arrayElemAt: ["$markupSubAgent", 0],
            },
            markupClient: {
              $arrayElemAt: ["$markupClient", 0],
            },
            specialMarkup: { $arrayElemAt: ["$specialMarkup", 0] },

            destination: { $arrayElemAt: ["$destination", 0] },
            category: { $arrayElemAt: ["$category", 0] },
            totalReviews: {
              $size: "$reviews",
            },
            totalRating: {
              $sum: {
                $map: {
                  input: "$reviews",
                  in: "$$this.rating",
                },
              },
            },
          },
        },
        {
          $addFields: {
            activitiesSpecial: {
              $map: {
                input: "$activities",
                as: "activity",
                in: {
                  $cond: [
                    {
                      $eq: ["$$activity.activityType", "normal"],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$specialMarkup.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.adultPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  "$specialMarkup.markup",
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$specialMarkup.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.sharedTransferPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    price: {
                                      $sum: [
                                        "$$transfers.price",
                                        {
                                          $divide: [
                                            {
                                              $multiply: [
                                                "$specialMarkup.markup",
                                                "$$transfers.price",
                                              ],
                                            },
                                            100,
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    $mergeObjects: [
                                      "$$transfers",
                                      {
                                        price: {
                                          $sum: [
                                            "$$transfers.price",
                                            "$specialMarkup.markup",
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            activitiesSubAgent: {
              $map: {
                input: "$activitiesSpecial",
                as: "activity",
                in: {
                  $cond: [
                    {
                      $eq: ["$$activity.activityType", "normal"],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupSubAgent.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.adultPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  "$markupSubAgent.markup",
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupSubAgent.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupSubAgent.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.sharedTransferPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    price: {
                                      $sum: [
                                        "$$transfers.price",
                                        {
                                          $divide: [
                                            {
                                              $multiply: [
                                                "$markupSubAgent.markup",
                                                "$$transfers.price",
                                              ],
                                            },
                                            100,
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  "$markupSubAgent.markup",
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    $mergeObjects: [
                                      "$$transfers",
                                      {
                                        price: {
                                          $sum: [
                                            "$$transfers.price",
                                            "$markupSubAgent.markup",
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupSubAgent.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },

        {
          $addFields: {
            activity: {
              $map: {
                input: "$activitiesSubAgent",
                as: "activity",
                in: {
                  $cond: [
                    {
                      $eq: ["$$activity.activityType", "normal"],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupClient.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupClient.markup",
                                          "$$activity.adultPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupClient.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  "$markupClient.markup",
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupClient.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupClient.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupClient.markup",
                                          "$$activity.sharedTransferPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    price: {
                                      $sum: [
                                        "$$transfers.price",
                                        {
                                          $divide: [
                                            {
                                              $multiply: [
                                                "$markupClient.markup",
                                                "$$transfers.price",
                                              ],
                                            },
                                            100,
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupClient.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  "$markupClient.markup",
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    $mergeObjects: [
                                      "$$transfers",
                                      {
                                        price: {
                                          $sum: [
                                            "$$transfers.price",
                                            "$markupClient.markup",
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupClient.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $set: {
            activity: { $arrayElemAt: ["$activity", 0] },
          },
        },
        {
          $project: {
            title: 1,
            destination: 1,
            category: {
              categoryName: 1,
              slug: 1,
            },
            images: 1,
            bookingType: 1,
            activity: 1,
            duration: 1,
            durationType: 1,
            totalReviews: 1,
            averageRating: {
              $cond: [
                { $eq: ["$totalReviews", 0] },
                0,
                {
                  $divide: ["$totalRating", "$totalReviews"],
                },
              ],
            },
            cancellationType: 1,
            cancelBeforeTime: 1,
            cancellationFee: 1,
            isCombo: 1,
            isOffer: 1,
            offerAmountType: 1,
            offerAmount: 1,
          },
        },

        {
          $group: {
            _id: null,
            totalAttractions: { $sum: 1 },
            data: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            totalAttractions: 1,
            data: {
              $slice: ["$data", Number(limit) * Number(skip), Number(limit)],
            },
          },
        },
      ]);

      console.log(attractions[0].data[0].activity, "attractions");

      res.status(200).json({
        attractions: attractions[0],
        skip: Number(skip),
        limit: Number(limit),
      });
      // }
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 500, err);
    }
  },

  listAllAttractions: async (req, res) => {
    try {
      const { skip = 0, limit = 10, search } = req.query;
      console.log(req.reseller._id, "resellerId");

      const filters1 = { isDeleted: false, isActive: true };

      if (search && search !== "") {
        filters1.title = { $regex: search, $options: "i" };
      }

      const attractions = await Attraction.aggregate([
        {
          $match: filters1,
        },
        {
          $lookup: {
            from: "attractionactivities",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
                      { $eq: ["$isDeleted", false] },
                    ],
                  },
                },
              },

              {
                $addFields: {
                  privateTransfer: {
                    $arrayElemAt: ["$privateTransfers", 0],
                  },
                },
              },
              {
                $addFields: {
                  lowPrice: {
                    $cond: {
                      if: {
                        $eq: ["$activityType", "normal"],
                      },
                      then: "$adultPrice",
                      else: {
                        $cond: {
                          if: {
                            $eq: ["$isSharedTransferAvailable", true],
                          },
                          then: "$sharedTransferPrice",
                          else: "$privateTransfer.price",
                        },
                      },
                    },
                  },
                },
              },
              {
                $sort: { adultPrice: 1 },
              },
            ],
            as: "activities",
          },
        },
        {
          $lookup: {
            from: "b2bspecialattractionmarkups",
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
                              if: {
                                $eq: [req.reseller.role, "sub-agent"],
                              },
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
            from: "b2bclientattractionmarkups",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$resellerId", req.reseller._id],
                      },
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
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
            from: "b2bsubagentattractionmarkups",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$resellerId", req.reseller._id],
                      },
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "markupSubagent",
          },
        },

        {
          $lookup: {
            from: "b2bsubagentattractionmarkups",
            let: {
              attraction: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$resellerId", req.reseller?.referredBy],
                      },
                      {
                        $eq: ["$attraction", "$$attraction"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "markupTo",
          },
        },
        {
          $lookup: {
            from: "destinations",
            localField: "destination",
            foreignField: "_id",
            as: "destination",
          },
        },

        {
          $set: {
            markupSubagent: {
              $arrayElemAt: ["$markupSubagent", 0],
            },
            specialMarkup: { $arrayElemAt: ["$specialMarkup", 0] },
            markupToAdd: { $arrayElemAt: ["$markupToAdd", 0] },

            markupClient: { $arrayElemAt: ["$markupClient", 0] },
            destination: { $arrayElemAt: ["$destination", 0] },
          },
        },
        {
          $addFields: {
            activitiesSpecial: {
              $map: {
                input: "$activities",
                as: "activity",
                in: {
                  $cond: [
                    {
                      $eq: ["$$activity.activityType", "normal"],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$specialMarkup.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.adultPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  "$specialMarkup.markup",
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$specialMarkup.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.sharedTransferPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    price: {
                                      $sum: [
                                        "$$transfers.price",
                                        {
                                          $divide: [
                                            {
                                              $multiply: [
                                                "$specialMarkup.markup",
                                                "$$transfers.price",
                                              ],
                                            },
                                            100,
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$specialMarkup.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    $mergeObjects: [
                                      "$$transfers",
                                      {
                                        price: {
                                          $sum: [
                                            "$$transfers.price",
                                            "$specialMarkup.markup",
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$specialMarkup.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            activities: {
              $map: {
                input: "$activitiesSpecial",
                as: "activity",
                in: {
                  $cond: [
                    {
                      $eq: ["$$activity.activityType", "normal"],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupToAdd.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupToAdd.markup",
                                          "$$activity.adultPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupToAdd.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              adultPrice: {
                                $sum: [
                                  "$$activity.adultPrice",
                                  "$markupToAdd.markup",
                                ],
                              },

                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupToAdd.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $cond: [
                        {
                          $eq: ["$markupToAdd.markupType", "percentage"],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupSubAgent.markup",
                                          "$$activity.sharedTransferPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    price: {
                                      $sum: [
                                        "$$transfers.price",
                                        {
                                          $divide: [
                                            {
                                              $multiply: [
                                                "$markupToAdd.markup",
                                                "$$transfers.price",
                                              ],
                                            },
                                            100,
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  {
                                    $divide: [
                                      {
                                        $multiply: [
                                          "$markupToAdd.markup",
                                          "$$activity.lowPrice",
                                        ],
                                      },
                                      100,
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          $mergeObjects: [
                            "$$activity",
                            {
                              sharedTransferPrice: {
                                $sum: [
                                  "$$activity.sharedTransferPrice",
                                  "$markupToAdd.markup",
                                ],
                              },
                              privateTransfers: {
                                $map: {
                                  input: "$$activity.privateTransfers",
                                  as: "transfers",
                                  in: {
                                    $mergeObjects: [
                                      "$$transfers",
                                      {
                                        price: {
                                          $sum: [
                                            "$$transfers.price",
                                            "$markupToAdd.markup",
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              lowPrice: {
                                $sum: [
                                  "$$activity.lowPrice",
                                  "$markupToAdd.markup",
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },

        {
          $set: {
            activities: { $arrayElemAt: ["$activities", 0] },
          },
        },
        {
          $project: {
            title: 1,
            destination: {
              name: 1,
            },
            markupClient: 1,
            markupSubagent: 1,
            bookingType: 1,
            activities: {
              lowPrice: 1,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAttractions: { $sum: 1 },
            data: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            totalAttractions: 1,
            data: 1,
          },
        },
      ]);

      console.log(attractions[0].data);

      res.status(200).json({
        attractions: attractions[0],
      });
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 400, err);
    }
  },
};
