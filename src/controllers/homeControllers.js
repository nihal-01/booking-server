const { sendErrorResponse } = require("../helpers");
const { HomeSettings, Attraction, Country, Destination } = require("../models");

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
            if (home?.bestSellingAttractions?.length > 0) {
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
                                            $eq: [
                                                "$attraction",
                                                "$$attraction",
                                            ],
                                        },
                                    },
                                },
                                {
                                    $sort: { createdAt: -1 },
                                },
                                {
                                    $limit: 1,
                                },
                            ],
                            as: "activity",
                        },
                    },
                    {
                        $set: {
                            activity: { $arrayElemAt: ["$activity", 0] },
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
                        $set: {
                            category: { $arrayElemAt: ["$category", 0] },
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
                                adultPrice: 1,
                            },
                        },
                    },
                ]);
            }

            let topAttractions = [];
            if (home?.topAttractions?.length > 0) {
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
                                            $eq: [
                                                "$attraction",
                                                "$$attraction",
                                            ],
                                        },
                                    },
                                },
                                {
                                    $sort: { createdAt: -1 },
                                },
                                {
                                    $limit: 1,
                                },
                            ],
                            as: "activity",
                        },
                    },
                    {
                        $set: {
                            activity: { $arrayElemAt: ["$activity", 0] },
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
                        $set: {
                            category: { $arrayElemAt: ["$category", 0] },
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
                                adultPrice: 1,
                            },
                        },
                    },
                ]);
            }

            res.status(200).json({
                home,
                bestSellingAttractions,
                topAttractions,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getInitialData: async (req, res) => {
        try {
            const countries = await Country.find({ isDeleted: false });
            const destinations = await Destination.find({ isDeleted: false });

            res.status(200).json({ countries, destinations });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
