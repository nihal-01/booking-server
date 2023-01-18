const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Attraction, Destination } = require("../../models");


module.exports = {
    getSingleAttraction: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }
            
            console.log(req.reseller._id)
            const attraction = await Attraction.aggregate([
                {
                    $match: {
                        _id: Types.ObjectId(id),
                        isDeleted: false,
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
                        from: "b2bclientattractionmarkups",
                        localField: "_id",
                        foreignField: "attraction",
                        as: "markup",
                    },
                },
               
                {
                    $unwind: "$markup"
                },
                {
                    $match: { 
                        
                        "markup.resellerId" :  req.reseller._id
                    }
                },
               
               
                {
                    $set: {
                        destination: { $arrayElemAt: ["$destination", 0] },
                        category: { $arrayElemAt: ["$category", 0] },
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
                                            $eq: [
                                                "$markup.markupType",
                                                "percentage",
                                            ],
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
                                                                        $multiply:
                                                                            [
                                                                                "$markup.markup",
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
                                                                        $multiply:
                                                                            [
                                                                                "$markup.markup",
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
                                                                $eq: [
                                                                    "$$activity.infantPrice",
                                                                    0,
                                                                ],
                                                            },
                                                            0,
                                                            {
                                                                $sum: [
                                                                    "$$activity.infantPrice",
                                                                    {
                                                                        $divide:
                                                                            [
                                                                                {
                                                                                    $multiply:
                                                                                        [
                                                                                            "$markup.markup",
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
                                                            "$markup.markup",
                                                        ],
                                                    },
                                                    childPrice: {
                                                        $sum: [
                                                            "$$activity.childPrice",
                                                            "$markup.markup",
                                                        ],
                                                    },
                                                    infantPrice: {
                                                        $cond: [
                                                            {
                                                                $eq: [
                                                                    "$$activity.infantPrice",
                                                                    0,
                                                                ],
                                                            },
                                                            0,
                                                            {
                                                                $sum: [
                                                                    "$$activity.infantPrice",
                                                                    "$markup.markup",
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

            console.log(attraction , "attraction")

            if (!attraction || attraction?.length < 1) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            res.status(200).json(attraction[0]);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllAttractions: async (req, res) => {
        try {
            const {
                skip = 0,
                limit = 10,
                destination,
                category,
                search
                
            } = req.query;

            const filters1 = { isDeleted: false };

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
            console.log(search , "search")

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
                        from: "b2bclientattractionmarkups",
                        localField: "_id",
                        foreignField: "attraction",
                        as: "markup",
                    },
                },
               
                {
                    $unwind: "$markup"
                },
                {
                    $match: { 
                        
                        "markup.resellerId" :  req.reseller._id
                    }
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
                        // markup: { $arrayElemAt: ["$markup", 0] },
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
                    $project: {
                        title: 1,
                        destination: 1,
                        category: {
                            categoryName: 1,
                            slug: 1,
                        },
                        images: 1,
                        bookingType: 1,
                        activity: {
                            adultPrice: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$markup.markupType",
                                            "percentage",
                                        ],
                                    },
                                    {
                                        $sum: [
                                            "$activity.adultPrice",
                                            {
                                                $divide: [
                                                    {
                                                        $multiply: [
                                                            "$markup.markup",
                                                            "$activity.adultPrice",
                                                        ],
                                                    },
                                                    100,
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        $sum: [
                                            "$activity.adultPrice",
                                            "$markup.markup",
                                        ],
                                    },
                                ],
                            },
                        },
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
                // {
                //     $match: filters2,
                // },
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
                            $slice: [
                                "$data",
                                Number(limit) * Number(skip),
                                Number(limit),
                            ],
                        },
                    },
                },
            ]);

            console.log( attractions , "attractions")

            res.status(200).json({
                attractions: attractions[0],
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
