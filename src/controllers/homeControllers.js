const { sendErrorResponse } = require("../helpers");
const {
    HomeSettings,
    Attraction,
    Country,
    Destination,
    Blog,
    Currency,
} = require("../models");

module.exports = {
    getHomeData: async (req, res) => {
        try {
            const home = await HomeSettings.findOne({
                settingsNumber: 1,
            }).lean();

            if (!home) {
                return sendErrorResponse(
                    res,
                    404,
                    "Home settings not added yet."
                );
            }

            let bestSellingAttractions = [];
            if (
                home?.isBestSellingAttractionsSectionEnabled &&
                home?.bestSellingAttractions?.length > 0
            ) {
                bestSellingAttractions = await Attraction.aggregate([
                    {
                        $match: {
                            _id: { $in: home.bestSellingAttractions },
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
                                                    $eq: [
                                                        "$attraction",
                                                        "$$attraction",
                                                    ],
                                                },
                                                { $eq: ["$isDeleted", false] },
                                                { $eq: ["$isActive", true] },
                                            ],
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
                            as: "activity",
                        },
                    },
                    {
                        $lookup: {
                            from: "attractioncategories",
                            foreignField: "_id",
                            localField: "category",
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
                            from: "destinations",
                            localField: "destination",
                            foreignField: "_id",
                            as: "destination",
                        },
                    },
                    {
                        $lookup: {
                            from: "b2cattractionmarkups",
                            localField: "_id",
                            foreignField: "attraction",
                            as: "markup",
                        },
                    },
                    {
                        $set: {
                            activity: { $arrayElemAt: ["$activity", 0] },
                            markup: { $arrayElemAt: ["$markup", 0] },
                            category: { $arrayElemAt: ["$category", 0] },
                            destination: { $arrayElemAt: ["$destination", 0] },
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
                        $project: {
                            title: 1,
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
                            totalReviews: 1,
                            averageRating: {
                                $cond: [
                                    { $eq: ["$totalReviews", 0] },
                                    0,
                                    {
                                        $divide: [
                                            "$totalRating",
                                            "$totalReviews",
                                        ],
                                    },
                                ],
                            },
                            destination: {
                                name: 1,
                            },
                        },
                    },
                ]);
            }

            let topAttractions = [];
            if (
                home?.isTopAttractionsSectionEnabled &&
                home?.topAttractions?.length > 0
            ) {
                topAttractions = await Attraction.aggregate([
                    {
                        $match: {
                            _id: { $in: home.topAttractions },
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
                                                    $eq: [
                                                        "$attraction",
                                                        "$$attraction",
                                                    ],
                                                },
                                                { $eq: ["$isDeleted", false] },
                                                { $eq: ["$isActive", true] },
                                            ],
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
                            as: "activity",
                        },
                    },
                    {
                        $lookup: {
                            from: "attractioncategories",
                            foreignField: "_id",
                            localField: "category",
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
                            from: "destinations",
                            localField: "destination",
                            foreignField: "_id",
                            as: "destination",
                        },
                    },
                    {
                        $lookup: {
                            from: "b2cattractionmarkups",
                            localField: "_id",
                            foreignField: "attraction",
                            as: "markup",
                        },
                    },
                    {
                        $set: {
                            activity: { $arrayElemAt: ["$activity", 0] },
                            markup: { $arrayElemAt: ["$markup", 0] },
                            category: { $arrayElemAt: ["$category", 0] },
                            destination: { $arrayElemAt: ["$destination", 0] },
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
                            totalReviews: 1,
                            averageReviews: {
                                $cond: [
                                    { $eq: ["$totalReviews", 0] },
                                    0,
                                    {
                                        $divide: [
                                            "$totalRating",
                                            "$totalReviews",
                                        ],
                                    },
                                ],
                            },
                            destination: {
                                name: 1,
                            },
                        },
                    },
                ]);
            }

            recentBlogs = [];
            if (home?.isBlogsEnabled) {
                recentBlogs = await Blog.find({})
                    .populate("category")
                    .sort({ createdAt: -1 })
                    .limit(3)
                    .lean();
            }

            res.status(200).json({
                home,
                bestSellingAttractions,
                topAttractions,
                recentBlogs,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getInitialData: async (req, res) => {
        try {
            const countries = await Country.find({ isDeleted: false });
            const destinations = await Destination.find({ isDeleted: false });
            const currencies = await Currency.find({})
                .populate("country", "countryName flag")
                .lean();

            res.status(200).json({ countries, destinations, currencies });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
