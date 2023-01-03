const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const {
    Attraction,
    AttractionCategory,
    AttractionActivity,
    Destination,
    AttractionOrder,
    AttractionReview,
} = require("../../models");
const {
    attractionSchema,
    attractionActivitySchema,
} = require("../validations/attraction.schema");
const { getDates } = require("../../utils");

const weekday = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

module.exports = {
    createNewAttraction: async (req, res) => {
        try {
            const {
                title,
                category,
                isActive,
                latitude,
                longitude,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                pickupAndDrop,
                sections,
                startDate,
                endDate,
                duration,
                durationType,
                offDays,
                offDates,
                bookingType,
                destination,
                highlights,
                faqs,
            } = req.body;

            const { _, error } = attractionSchema.validate({
                ...req.body,
                offDays: offDays ? JSON.parse(offDays) : [],
                sections: sections ? JSON.parse(sections) : [],
                faqs: faqs ? JSON.parse(faqs) : [],
            });
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(category)) {
                return sendErrorResponse(res, 400, "Invalid category Id");
            }

            const attractionCategory = await AttractionCategory.findById(
                category
            );
            if (!attractionCategory) {
                return sendErrorResponse(res, 404, "Category not found!");
            }

            if (!isValidObjectId(destination)) {
                return sendErrorResponse(res, 400, "Invalid destination id");
            }

            const destinationDetails = await Destination.findById(destination);
            if (!destinationDetails) {
                return sendErrorResponse(res, 404, "Destination not found");
            }

            let offDatesList = [];
            offDates && offDatesList.push(offDates);

            if (offDays) {
                console.log(JSON.parse(offDays));
                const offDaysFiltered = JSON.parse(offDays).map((day) => {
                    return day?.toLowerCase();
                });

                if (offDaysFiltered.length > 0) {
                    const dates = getDates(startDate, endDate);

                    for (let i = 0; i < dates.length; i++) {
                        const day = weekday[new Date(dates[i]).getDay()];

                        if (offDays?.includes(day.toLowerCase())) {
                            offDatesList.push(dates[i]);
                        }
                    }
                }
            }

            let images = [];
            for (let i = 0; i < req.files?.length; i++) {
                const img = "/" + req.files[i]?.path?.replace(/\\/g, "/");
                images.push(img);
            }

            let parsedSections;
            if (sections) {
                parsedSections = JSON.parse(sections);
            }

            let parsedFaqs;
            if (faqs) {
                parsedFaqs = JSON.parse(faqs);
            }

            const newAttraction = new Attraction({
                title,
                bookingType,
                category,
                isActive,
                latitude,
                longitude,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                images,
                pickupAndDrop,
                sections: parsedSections,
                startDate,
                endDate,
                offDays: offDatesList,
                duration,
                durationType,
                destination,
                highlights,
                faqs: parsedFaqs,
            });
            await newAttraction.save();

            res.status(200).json(newAttraction);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateAttraction: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                title,
                category,
                isActive,
                latitude,
                longitude,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                pickupAndDrop,
                sections,
                startDate,
                endDate,
                duration,
                durationType,
                offDays,
                offDates,
                bookingType,
                destination,
                highlights,
                oldImages,
                faqs,
            } = req.body;

            const { _, error } = attractionSchema.validate({
                ...req.body,
                offDays: offDays ? JSON.parse(offDays) : [],
                sections: sections ? JSON.parse(sections) : [],
                oldImages: oldImages ? JSON.parse(oldImages) : [],
                faqs: faqs ? JSON.parse(faqs) : [],
            });
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            if (category && !isValidObjectId(category)) {
                return sendErrorResponse(res, 400, "Invalid category Id");
            }

            const attractionCategory = await AttractionCategory.findById(
                category
            );
            if (!attractionCategory) {
                return sendErrorResponse(res, 404, "Category not found!");
            }

            let parsedOldImages = [];
            if (oldImages) {
                parsedOldImages = JSON.parse(oldImages);
            }

            let newImages = [...parsedOldImages];
            for (let i = 0; i < req.files?.length; i++) {
                const img = "/" + req.files[i]?.path?.replace(/\\/g, "/");
                newImages.push(img);
            }

            let parsedSections;
            if (sections) {
                parsedSections = JSON.parse(sections);
            }

            let parsedFaqs;
            if (faqs) {
                parsedFaqs = JSON.parse(faqs);
            }

            const attraction = await Attraction.findOneAndUpdate(
                { _id: id, isDeleted: false },
                {
                    title,
                    category,
                    isActive,
                    latitude,
                    longitude,
                    isOffer,
                    offerAmountType,
                    offerAmount,
                    youtubeLink,
                    images: newImages,
                    pickupAndDrop,
                    sections: parsedSections,
                    startDate,
                    endDate,
                    duration,
                    durationType,
                    offDates,
                    bookingType,
                    destination,
                    highlights,
                    faqs: parsedFaqs,
                },
                { runValidators: true, new: true }
            );

            if (!attraction) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            res.status(200).json(attraction);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addAttractionActivity: async (req, res) => {
        try {
            const {
                attraction,
                name,
                facilities,
                adultAgeLimit,
                adultPrice,
                childAgeLimit,
                childPrice,
                infantAgeLimit,
                infantPrice,
                isCancelable,
                isVat,
                vat,
                base,
                isTransferAvailable,
                privateTransferPrice,
                sharedTransferPrice,
                isActive,
                peakTime,
                note,
            } = req.body;

            const { _, error } = attractionActivitySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(attraction)) {
                return sendErrorResponse(res, 400, "Invalid attraction id!");
            }

            const attr = await Attraction.findById(attraction);
            if (!attr) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            const newTicket = new AttractionActivity({
                attraction,
                name,
                facilities,
                adultAgeLimit,
                adultPrice,
                childAgeLimit,
                childPrice,
                infantAgeLimit,
                infantPrice,
                isCancelable,
                isVat,
                vat,
                base,
                isTransferAvailable,
                privateTransferPrice,
                sharedTransferPrice,
                isActive,
                peakTime,
                note,
            });
            await newTicket.save();

            res.status(200).json(newTicket);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    uploadTickets: async (req, res) => {
        try {
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllAttractions: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const attractions = await Attraction.aggregate([
                { $match: { isDeleted: false } },
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
                        from: "attractionreviews",
                        localField: "_id",
                        foreignField: "attraction",
                        as: "reviews",
                    },
                },
                {
                    $set: {
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
                        destination: { $arrayElemAt: ["$destination", 0] },
                    },
                },
                {
                    $project: {
                        title: 1,
                        bookingType: 1,
                        isOffer: 1,
                        offerAmountType: 1,
                        offerAmount: 1,
                        destination: 1,
                        totalReviews: 1,
                        averageRating: {
                            $cond: [
                                { $eq: ["$totalReviews", 0] },
                                0,
                                { $divide: ["$totalRating", "$totalReviews"] },
                            ],
                        },
                        createdAt: 1,
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
            ]);

            const totalAttractions = await Attraction.find({
                isDeleted: false,
            }).count();

            res.status(200).json({
                attractions,
                totalAttractions,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getInitialData: async (req, res) => {
        try {
            const categories = await AttractionCategory.find({});

            res.status(200).json({ categories });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleAttraction: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attraction = await Attraction.findOne({
                _id: id,
                isDeleted: false,
            })
                .populate("activities")
                .lean();

            if (!attraction) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            res.status(200).json(attraction);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteAttraction: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attraction = await Attraction.findByIdAndUpdate(id, {
                isDeleted: true,
            });
            if (!attraction) {
                return sendErrorResponse(res, 400, "Attraction not found");
            }

            res.status(200).json({
                message: "Attraction successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllOrders: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const orders = await AttractionOrder.aggregate([
                { $match: { status: { $ne: "pending" } } },
                {
                    $lookup: {
                        from: "attractions",
                        localField: "attraction",
                        foreignField: "_id",
                        as: "attraction",
                    },
                },
                {
                    $set: {
                        attraction: { $arrayElemAt: ["$attraction", 0] },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $set: {
                        user: { $arrayElemAt: ["$user", 0] },
                    },
                },
                {
                    $lookup: {
                        from: "countries",
                        localField: "user.country",
                        foreignField: "_id",
                        as: "country",
                    },
                },
                {
                    $set: {
                        "user.country": { $arrayElemAt: ["$country", 0] },
                    },
                },
                { $unwind: "$activities" },
                {
                    $lookup: {
                        from: "attractionactivities",
                        localField: "activities.activity",
                        foreignField: "_id",
                        as: "activity",
                    },
                },
                {
                    $set: {
                        activity: {
                            $arrayElemAt: ["$activity", 0],
                        },
                    },
                },
                {
                    $project: {
                        activity: {
                            name: 1,
                        },
                        attraction: {
                            title: 1,
                            images: 1,
                        },
                        activities: 1,
                        bookingType: 1,
                        user: {
                            name: 1,
                            email: 1,
                            country: 1,
                            phoneNumber: 1,
                        },
                        orderId: 1,
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
            ]);

            const totalOrders = await AttractionOrder.find({}).count();

            res.status(200).json({
                orders,
                totalOrders,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleAttractionReviews: async (req, res) => {
        try {
            const { id } = req.params;
            const { skip = 0, limit = 10 } = req.query;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attraction = await Attraction.findById(id).select("title");
            if (!attraction) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            const attractionReviews = await AttractionReview.find({
                attraction: id,
            })
                .populate("user", "name avatar email")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalAttractionReviews = await AttractionReview.find({
                attraction: id,
            }).count();

            res.status(200).json({
                attractionReviews,
                attraction,
                totalAttractionReviews,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
