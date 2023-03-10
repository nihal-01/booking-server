const { isValidObjectId, Types } = require("mongoose");

const { sendErrorResponse } = require("../helpers");
const { Attraction, Destination } = require("../models/");

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
                        from: "b2cattractionmarkups",
                        localField: "_id",
                        foreignField: "attraction",
                        as: "markup",
                    },
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
                        markup: { $arrayElemAt: ["$markup", 0] },
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
                                                $eq: [
                                                    "$attraction",
                                                    "$$attraction",
                                                ],
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
                                                $eq: [
                                                    "$activityType",
                                                    "normal",
                                                ],
                                            },
                                            then: "$adultPrice",
                                            else: {
                                                $cond: {
                                                    if: {
                                                        $eq: [
                                                            "$isSharedTransferAvailable",
                                                            true,
                                                        ],
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
                                $sort: { lowPrice: 1 },
                            },
                        ],
                        as: "activities",
                    },
                },
                {
                    $addFields: {
                        activities: {
                            $map: {
                                input: "$activities",
                                as: "activity",
                                in: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$$activity.activityType",
                                                "normal",
                                            ],
                                        },
                                        {
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
                                                                        $divide:
                                                                            [
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
                                                                        $divide:
                                                                            [
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
                                                            lowPrice: {
                                                                $sum: [
                                                                    "$$activity.lowPrice",
                                                                    {
                                                                        $divide:
                                                                            [
                                                                                {
                                                                                    $multiply:
                                                                                        [
                                                                                            "$markup.markup",
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
                                                            lowPrice: {
                                                                $sum: [
                                                                    "$$activity.lowPrice",
                                                                    "$markup.markup",
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
                                                    $eq: [
                                                        "$markup.markupType",
                                                        "percentage",
                                                    ],
                                                },
                                                {
                                                    $mergeObjects: [
                                                        "$$activity",
                                                        {
                                                            sharedTransferPrice:
                                                                {
                                                                    $sum: [
                                                                        "$$activity.sharedTransferPrice",
                                                                        {
                                                                            $divide:
                                                                                [
                                                                                    {
                                                                                        $multiply:
                                                                                            [
                                                                                                "$markup.markup",
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
                                                                                    $divide:
                                                                                        [
                                                                                            {
                                                                                                $multiply:
                                                                                                    [
                                                                                                        "$markup.markup",
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
                                                                        $divide:
                                                                            [
                                                                                {
                                                                                    $multiply:
                                                                                        [
                                                                                            "$markup.markup",
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
                                                            sharedTransferPrice:
                                                                {
                                                                    $sum: [
                                                                        "$$activity.sharedTransferPrice",
                                                                        "$markup.markup",
                                                                    ],
                                                                },
                                                            privateTransfers: {
                                                                $map: {
                                                                    input: "$$activity.privateTransfers",
                                                                    as: "transfers",
                                                                    in: {
                                                                        $mergeObjects:
                                                                            [
                                                                                "$$transfers",
                                                                                {
                                                                                    price: {
                                                                                        $sum: [
                                                                                            "$$transfers.price",
                                                                                            "$markup.markup",
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
                                                                    "$markup.markup",
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
                                input: "$activities",
                                as: "activity",
                                in: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$$activity.activityType",
                                                "normal",
                                            ],
                                        },
                                        {
                                            $cond: [
                                                {
                                                    $eq: [
                                                        "$offerAmountType",
                                                        "percentage",
                                                    ],
                                                },
                                                {
                                                    $mergeObjects: [
                                                        "$$activity",
                                                        {
                                                            adultlowPrice: {
                                                                $subtract: [
                                                                    "$$activity.adultPrice",
                                                                    {
                                                                        $divide:
                                                                            [
                                                                                {
                                                                                    $multiply:
                                                                                        [
                                                                                            "$offerAmount",
                                                                                            "$$activity.adultPrice",
                                                                                        ],
                                                                                },
                                                                                100,
                                                                            ],
                                                                    },
                                                                ],
                                                            },
                                                            childlowPrice: {
                                                                $subtract: [
                                                                    "$$activity.childPrice",
                                                                    {
                                                                        $divide:
                                                                            [
                                                                                {
                                                                                    $multiply:
                                                                                        [
                                                                                            "$offerAmount",
                                                                                            "$$activity.childPrice",
                                                                                        ],
                                                                                },
                                                                                100,
                                                                            ],
                                                                    },
                                                                ],
                                                            },
                                                            infantlowPrice: {
                                                                $cond: [
                                                                    {
                                                                        $or: [
                                                                            {
                                                                                $eq: [
                                                                                    "$offerAmount",
                                                                                    null,
                                                                                ],
                                                                            },
                                                                            {
                                                                                $eq: [
                                                                                    "$$activity.infantPrice",
                                                                                    0,
                                                                                ],
                                                                            },
                                                                        ],
                                                                    },
                                                                    0,
                                                                    {
                                                                        $subtract:
                                                                            [
                                                                                "$$activity.infantPrice",
                                                                                {
                                                                                    $divide:
                                                                                        [
                                                                                            {
                                                                                                $multiply:
                                                                                                    [
                                                                                                        "$offerAmount",
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
                                                            offerlowPrice: {
                                                                $subtract: [
                                                                    "$$activity.lowPrice",
                                                                    {
                                                                        $divide:
                                                                            [
                                                                                {
                                                                                    $multiply:
                                                                                        [
                                                                                            "$offerAmount",
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
                                                            adultlowPrice: {
                                                                $subtract: [
                                                                    "$$activity.adultPrice",
                                                                    "$offerAmount",
                                                                ],
                                                            },
                                                            childlowPrice: {
                                                                $subtract: [
                                                                    "$$activity.childPrice",
                                                                    "$offerAmount",
                                                                ],
                                                            },
                                                            infantlowPrice: {
                                                                $cond: [
                                                                    {
                                                                        $or: [
                                                                            {
                                                                                $eq: [
                                                                                    "$$activity.infantPrice",
                                                                                    null,
                                                                                ],
                                                                            },
                                                                            {
                                                                                $eq: [
                                                                                    "$$activity.infantPrice",
                                                                                    0,
                                                                                ],
                                                                            },
                                                                        ],
                                                                    },
                                                                    0,
                                                                    {
                                                                        $subtract:
                                                                            [
                                                                                "$$activity.infantPrice",
                                                                                "$offerAmount",
                                                                            ],
                                                                    },
                                                                ],
                                                            },

                                                            offerlowPrice: {
                                                                $sum: [
                                                                    "$$activity.lowPrice",
                                                                    "$offerAmount",
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
                                                    $eq: [
                                                        "$offerAmountType",
                                                        "percentage",
                                                    ],
                                                },
                                                {
                                                    $mergeObjects: [
                                                        "$$activity",
                                                        {
                                                            sharedTransferlowPrice:
                                                                {
                                                                    $subtract: [
                                                                        "$$activity.sharedTransferPrice",
                                                                        {
                                                                            $divide:
                                                                                [
                                                                                    {
                                                                                        $multiply:
                                                                                            [
                                                                                                "$offerAmount",
                                                                                                "$$activity.sharedTransferPrice",
                                                                                            ],
                                                                                    },
                                                                                    100,
                                                                                ],
                                                                        },
                                                                    ],
                                                                },
                                                            privateTransferslow:
                                                                {
                                                                    $map: {
                                                                        input: "$$activity.privateTransfers",
                                                                        as: "transfers",
                                                                        in: {
                                                                            price: {
                                                                                $subtract:
                                                                                    [
                                                                                        "$$transfers.price",
                                                                                        {
                                                                                            $divide:
                                                                                                [
                                                                                                    {
                                                                                                        $multiply:
                                                                                                            [
                                                                                                                "$offerAmount",
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
                                                            offerlowPrice: {
                                                                $subtract: [
                                                                    "$$activity.lowPrice",
                                                                    {
                                                                        $divide:
                                                                            [
                                                                                {
                                                                                    $multiply:
                                                                                        [
                                                                                            "$offerAmount",
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
                                                            sharedTransferlowPrice:
                                                                {
                                                                    $subtract: [
                                                                        "$$activity.sharedTransferPrice",
                                                                        "$offerAmount",
                                                                    ],
                                                                },
                                                            privateTransferslow:
                                                                {
                                                                    $map: {
                                                                        input: "$$activity.privateTransfers",
                                                                        as: "transfers",
                                                                        in: {
                                                                            $mergeObjects:
                                                                                [
                                                                                    "$$transfers",
                                                                                    {
                                                                                        price: {
                                                                                            $subtract:
                                                                                                [
                                                                                                    "$$transfers.price",
                                                                                                    "$offerAmount",
                                                                                                ],
                                                                                        },
                                                                                    },
                                                                                ],
                                                                        },
                                                                    },
                                                                },
                                                            offerlowPrice: {
                                                                $subtract: [
                                                                    "$$activity.lowPrice",
                                                                    "$offerAmount",
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
                        activities: {
                            privateTransfer: 0,
                        },
                    },
                },
            ]);

            if (!attraction || attraction?.length < 1) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            console.log(attraction[0], "attraction[0],");

            console.log(attraction[0], "attraction[0]");

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
                priceFrom,
                priceTo,
                rating,
                durationFrom,
                durationTo,
                durationFromType,
                durationToType,
                search,
                isCombo,
                isOffer,
            } = req.query;

            const filters1 = { isDeleted: false, isActive: true };
            const filters2 = {};

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

            if (search && search !== "") {
                filters1.title = { $regex: search, $options: "i" };
            }

            if (isOffer && isOffer !== "") {
                filters1.isOffer = isOffer === "true";
            }

            if (isCombo && isCombo !== "") {
                filters1.isCombo = isCombo === "true";
            }

            if (
                durationFrom &&
                durationFrom != "" &&
                durationFromType &&
                durationFromType !== "" &&
                durationTo &&
                durationTo !== "" &&
                durationToType &&
                durationToType != ""
            ) {
                filters1.$and = [
                    {
                        duration: { $gte: Number(durationFrom) },
                        durationType: durationFromType?.toLowerCase(),
                    },
                    {
                        duration: { $lte: Number(durationTo) },
                        durationType: {
                            $in: [
                                durationFromType?.toLowerCase(),
                                durationToType?.toLowerCase(),
                            ],
                        },
                    },
                ];
            } else if (
                durationFrom &&
                durationFrom != "" &&
                durationFromType &&
                durationFromType !== ""
            ) {
                filters1.duration = { $gte: Number(durationFrom) };
                filters1.durationType = durationFromType?.toLowerCase();
            } else if (
                durationTo &&
                durationTo !== "" &&
                durationToType &&
                durationToType != ""
            ) {
                filters1.duration = { $lte: Number(durationTo) };
                filters1.durationType = durationToType?.toLowerCase();
            }

            if (priceFrom && priceFrom !== "" && priceTo && priceTo !== "") {
                filters2.$and = [
                    { "activity.adultPrice": { $gte: Number(priceFrom) } },
                    { "activity.adultPrice": { $lte: Number(priceTo) } },
                ];
            } else if (priceFrom && priceFrom !== "") {
                filters2["activity.adultPrice"] = { $gte: Number(priceFrom) };
            } else if (priceTo && priceTo !== "") {
                filters2["activity.adultPrice"] = { $lte: Number(priceTo) };
            }

            if (rating && rating !== "") {
                filters2.averageRating = { $gte: Number(rating) };
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
                                                $eq: [
                                                    "$attraction",
                                                    "$$attraction",
                                                ],
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
                                                $eq: [
                                                    "$activityType",
                                                    "normal",
                                                ],
                                            },
                                            then: "$adultPrice",
                                            else: {
                                                $cond: {
                                                    if: {
                                                        $eq: [
                                                            "$isSharedTransferAvailable",
                                                            true,
                                                        ],
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
                                $sort: { lowPrice: 1 },
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
                        from: "b2cattractionmarkups",
                        localField: "_id",
                        foreignField: "attraction",
                        as: "markup",
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
                        markup: { $arrayElemAt: ["$markup", 0] },
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
                            lowPrice: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$markup.markupType",
                                            "percentage",
                                        ],
                                    },
                                    {
                                        $sum: [
                                            "$activity.lowPrice",
                                            {
                                                $divide: [
                                                    {
                                                        $multiply: [
                                                            "$markup.markup",
                                                            "$activity.lowPrice",
                                                        ],
                                                    },
                                                    100,
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        $sum: [
                                            "$activity.lowPrice",
                                            "$markup.markup",
                                        ],
                                    },
                                ],
                            },
                            activityType: 1,
                            isSharedTransferAvailable: 1,
                            isPrivateTransferAvailable: 1,
                            privateTransfer: 1,
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
                {
                    $match: filters2,
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
                            $slice: [
                                "$data",
                                Number(limit) * Number(skip),
                                Number(limit),
                            ],
                        },
                    },
                },
            ]);

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
