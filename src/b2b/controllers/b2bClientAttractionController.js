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
                    $eq: ["$attraction", "$$attraction"],
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
          $addFields: {
            activitiesSpecial: {
              $map: {
                input: "$activities",
                as: "activity",
                in: {
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
                                $eq: ["$$activity.infantPrice", 0],
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
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        // {
        //   $addFields: {
        //     activitiesSpecial: {
        //       $map: {
        //         input: "$activities",
        //         as: "activity",
        //         in: {
        //           $cond: [
        //             { $eq: ["$specialMarkup.markupType", "percentage"] },
        //             {
        //               $mergeObjects: [
        //                 "$$activity",
        //                 {
        //                   adultPrice: {
        //                     $sum: [
        //                       "$$activity.adultPrice",
        //                       {
        //                         $multiply: [
        //                           "$$activity.adultPrice",
        //                           { $divide: ["$specialMarkup.markup", 100] },
        //                         ],
        //                       },
        //                     ],
        //                   },
        //                   childPrice: {
        //                     $sum: [
        //                       "$$activity.childPrice",
        //                       {
        //                         $multiply: [
        //                           "$$activity.childPrice",
        //                           { $divide: ["$specialMarkup.markup", 100] },
        //                         ],
        //                       },
        //                     ],
        //                   },
        //                   infantPrice: {
        //                     $cond: [
        //                       { $eq: ["$$activity.infantPrice", 0] },
        //                       0,
        //                       {
        //                         $sum: [
        //                           "$$activity.infantPrice",
        //                           {
        //                             $multiply: [
        //                               "$$activity.infantPrice",
        //                               {
        //                                 $divide: ["$specialMarkup.markup", 100],
        //                               },
        //                             ],
        //                           },
        //                         ],
        //                       },
        //                     ],
        //                   },
        //                 },
        //               ],
        //             },
        //             {
        //               $mergeObjects: [
        //                 "$$activity",
        //                 {
        //                   adultPrice: {
        //                     $sum: [
        //                       "$$activity.adultPrice",
        //                       "$specialMarkup.markup",
        //                     ],
        //                   },
        //                   childPrice: {
        //                     $sum: [
        //                       "$$activity.childPrice",
        //                       "$specialMarkup.markup",
        //                     ],
        //                   },
        //                   infantPrice: {
        //                     $cond: [
        //                       { $eq: ["$$activity.infantPrice", 0] },
        //                       0,
        //                       {
        //                         $sum: [
        //                           "$$activity.infantPrice",
        //                           "$specialMarkup.markup",
        //                         ],
        //                       },
        //                     ],
        //                   },
        //                 },
        //               ],
        //             },
        //           ],
        //         },
        //       },
        //     },
        //   },
        // },
        {
          $addFields: {
            
            activitiesSubAgent: {
              $map: {
                input: "$activitiesSpecial",
                as: "activity",
                in: {
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
                                $eq: ["$$activity.infantPrice", 0],
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
                                $eq: ["$$activity.infantPrice", 0],
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
          },
        },
      ]);

      let ticketCount;
      let ticketStatus = true;
      if (attraction[0].bookingType == "ticket") {
        ticketCount = await AttractionTicket.find({
          activity: attraction[0].activities[0]._id,
          status: "ok",
        }).count();

        if (ticketCount < 1) {
          ticketStatus = false;
        }
      }

      console.log(attraction[0].activity, "attraction");

      if (!attraction || attraction?.length < 1) {
        return sendErrorResponse(res, 404, "Attraction not found");
      }
      // res.status(200).json(attraction[0]);

      res
        .status(200)
        .json({ attraction: attraction[0], ticketStatus, ticketCount });
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
                    $eq: ["$attraction", "$$attraction"],
                  },
                },
              },
              {
                $sort: { adultPrice: 1 },
              },
              {
                $limit: 1,
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
            // activitiesSpecial: {
            //   $filter: {
            //     input: "$activities",
            //     as: "item",
            //     cond: { $eq: ["$$item.isDeleted", false] },
            //   },
            // },
            activitiesSpecial: {
              $map: {
                input: "$activities",
                as: "activity",
                in: {
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
              $filter: {
                input: "$activitiesSpecial",
                as: "item",
                cond: { $eq: ["$$item.isDeleted", false] },
              },
            },
            activitiesSubAgent: {
              $map: {
                input: "$activitiesSpecial",
                as: "activity",
                in: {
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
            activitiesSpecial: 1,
            destination: 1,
            category: {
              categoryName: 1,
              slug: 1,
            },
            images: 1,
            bookingType: 1,
            activity: 1,
            // activity: {
            //   adultPrice: {
            //     $cond: [
            //       {
            //         $eq: ["$markup.markupType", "percentage"],
            //       },
            //       {
            //         $sum: [
            //           "$activity.adultPrice",
            //           {
            //             $divide: [
            //               {
            //                 $multiply: [
            //                   "$markup.markup",
            //                   "$activity.adultPrice",
            //                 ],
            //               },
            //               100,
            //             ],
            //           },
            //         ],
            //       },
            //       {
            //         $sum: ["$activity.adultPrice", "$markup.markup"],
            //       },
            //     ],
            //   },
            // },
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

      console.log(attractions[0].data[0], "attractions");

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
                    $eq: ["$attraction", "$$attraction"],
                  },
                },
              },
              {
                $sort: { adultPrice: 1 },
              },
              {
                $limit: 1,
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

            markupClient: { $arrayElemAt: ["$markupClient", 0] },
            destination: { $arrayElemAt: ["$destination", 0] },
          },
        },
        {
          $addFields: {
            activities: {
              $filter: {
                input: "$activities",
                as: "item",
                cond: { $eq: ["$$item.isDeleted", false] },
              },
            },
            activities: {
              $map: {
                input: "$activities",
                as: "activity",
                in: {
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
              adultPrice: 1,
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

      console.log(attractions[0].data[0], "hiiii");

      res.status(200).json({
        attractions: attractions[0],
      });
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 400, err);
    }
  },
};
