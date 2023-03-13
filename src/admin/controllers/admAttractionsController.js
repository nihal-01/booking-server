const { isValidObjectId, Types } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const {
    Attraction,
    AttractionCategory,
    AttractionActivity,
    Destination,
    AttractionReview,
} = require("../../models");
const {
    attractionApi,
    getAgentTickets,
    getLeastPriceOfDay,
    getBalance,
    AuthenticationRequest,
} = require("../helpers");

const {
    attractionSchema,
    attractionActivitySchema,
} = require("../validations/attraction.schema");

module.exports = {
    createNewAttraction: async (req, res) => {
        try {
            const {
                title,
                category,
                isActive,
                mapLink,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                sections,
                isCustomDate,
                startDate,
                endDate,
                duration,
                durationType,
                availability,
                offDates,
                bookingType,
                destination,
                highlights,
                itineraryDescription,
                faqs,
                cancellationType,
                cancelBeforeTime,
                cancellationFee,
                isApiConnected,
                connectedApi,
                isCombo,
                bookingPriorDays,
            } = req.body;

            const { _, error } = attractionSchema.validate({
                ...req.body,
                sections: sections ? JSON.parse(sections) : [],
                faqs: faqs ? JSON.parse(faqs) : [],
                offDates: offDates ? JSON.parse(offDates) : [],
                availability: availability ? JSON.parse(availability) : [],
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

            const destinationDetails = await Destination.findOne({
                _id: destination,
                isDeleted: false,
            });
            if (!destinationDetails) {
                return sendErrorResponse(res, 404, "Destination not found");
            }

            let images = [];
            let image = req.files["images"];
            if (!image || image?.length < 1) {
                return sendErrorResponse(
                    res,
                    400,
                    "minimum 1 image is required"
                );
            } else {
                for (let i = 0; i < image?.length; i++) {
                    const img = "/" + image[i]?.path?.replace(/\\/g, "/");
                    images.push(img);
                }
            }

            let logos = req.files["logo"];
            const logo = "/" + logos[0]?.path?.replace(/\\/g, "/");

            let parsedSections;
            if (sections) {
                parsedSections = JSON.parse(sections);
            }

            let parsedFaqs;
            if (faqs) {
                parsedFaqs = JSON.parse(faqs);
            }

            let parsedOffDates;
            if (offDates) {
                parsedOffDates = JSON.parse(offDates);
            }

            let parsedAvailability;
            if (availability) {
                parsedAvailability = JSON.parse(availability);
            }

            // if (isApiConnected) {
            //     let apiData = await attractionApi(res, connectedApi);
            // }

            const newAttraction = new Attraction({
                title,
                logo,
                bookingType,
                category,
                mapLink,
                isActive,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                images,
                sections: parsedSections,
                startDate,
                isCustomDate,
                endDate,
                offDates: parsedOffDates,
                availability: parsedAvailability,
                duration,
                durationType,
                destination,
                highlights,
                itineraryDescription,
                faqs: parsedFaqs,
                cancellationType,
                cancelBeforeTime,
                cancellationFee,
                isApiConnected,
                connectedApi:
                    isApiConnected === "true" ? connectedApi : undefined,
                isCombo,
                bookingPriorDays,
                isActive: true,
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
                logo,
                category,
                isActive,
                mapLink,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                sections,
                isCustomDate,
                startDate,
                endDate,
                duration,
                durationType,
                availability,
                offDates,
                bookingType,
                destination,
                highlights,
                itineraryDescription,
                faqs,
                cancellationType,
                cancelBeforeTime,
                cancellationFee,
                isApiConnected,
                connectedApi,
                isCombo,
                oldImages,
                bookingPriorDays,
            } = req.body;

            const { _, error } = attractionSchema.validate({
                ...req.body,
                sections: sections ? JSON.parse(sections) : [],
                faqs: faqs ? JSON.parse(faqs) : [],
                offDates: offDates ? JSON.parse(offDates) : [],
                availability: availability ? JSON.parse(availability) : [],
                oldImages: oldImages ? JSON.parse(oldImages) : [],
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

            let images = [...parsedOldImages];

            if (req.files["images"]) {
                let image = req.files["images"];
                for (let i = 0; i < image.length; i++) {
                    const img = "/" + image[i]?.path?.replace(/\\/g, "/");
                    images.push(img);
                }
            }

            let oldLogo = logo;
            if (req.files["logo"]) {
                let logos = req.files["logo"];
                oldLogo = "/" + logos[0]?.path?.replace(/\\/g, "/");
            }

            let parsedSections;
            if (sections) {
                parsedSections = JSON.parse(sections);
            }

            let parsedFaqs;
            if (faqs) {
                parsedFaqs = JSON.parse(faqs);
            }

            let parsedOffDates;
            if (offDates) {
                parsedOffDates = JSON.parse(offDates);
            }

            let parsedAvailability;
            if (availability) {
                parsedAvailability = JSON.parse(availability);
            }

            const attraction = await Attraction.findOneAndUpdate(
                { _id: id, isDeleted: false },
                {
                    title,
                    logo: oldLogo,
                    bookingType,
                    category,
                    mapLink,
                    isActive,
                    isOffer,
                    offerAmountType,
                    offerAmount,
                    youtubeLink,
                    images: images,
                    sections: parsedSections,
                    startDate,
                    isCustomDate,
                    endDate,
                    offDates: parsedOffDates,
                    availability: parsedAvailability,
                    duration,
                    durationType,
                    destination,
                    highlights,
                    itineraryDescription,
                    faqs: parsedFaqs,
                    cancellationType,
                    cancelBeforeTime,
                    cancellationFee,
                    isApiConnected,
                    connectedApi:
                        isApiConnected === "true" ? connectedApi : undefined,
                    isCombo,
                    bookingPriorDays,
                },
                { runValidators: true, new: true }
            );

            if (!attraction) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            res.status(200).json(attraction);
        } catch (err) {
            // console.log(err, "error");
            sendErrorResponse(res, 500, err);
        }
    },

    showBalance: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id!");
            }

            console.log(id, "call reached");

            const attr = await Attraction.findById(id);
            if (!attr) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            if (!attr.isApiConnected) {
                return sendErrorResponse(res, 404, "Api not Connected");
            }

            if (id == "63afca1b5896ed6d0f297449") {
                let balanceDetails = await getBalance(res, attr.connectedApi);

                res.status(200).json({ balanceDetails });
            }
        } catch (err) {}
    },

    connectApi: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id!");
            }

            console.log(id, "call reached");

            const attr = await Attraction.findById(id);
            if (!attr) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            if (!attr.isApiConnected) {
                return sendErrorResponse(res, 404, "Api not Connected");
            }

            if (id == "63afca1b5896ed6d0f297449") {
                let activities = [];

                let apiData;
                if (attr.isApiConnected) {
                    apiData = await attractionApi(res, attr.connectedApi);
                }

                console.log(apiData);

                for (i = 0; i < apiData.length; i++) {
                    let activity = null;

                    activity = await AttractionActivity.findOne({
                        attraction: attr._id,
                        isDeleted: false,
                        productId: apiData[i].productId,
                    });

                    if (activity == null) {
                        let newActivity = new AttractionActivity({
                            name: apiData[i].name,
                            attraction: attr._id,
                            isApiSync: true,
                            activityType: "normal",
                            productId: apiData[i].productId,
                            productCode: apiData[i].productCode,
                            childPrice: apiData[i].prices[0].totalPrice,
                            adultPrice: apiData[i].prices[0].totalPrice,
                            childCost: apiData[i].prices[0].totalPrice,
                            adultCost: apiData[i].prices[0].totalPrice,
                            adultAgeLimit: 60,
                            childAgeLimit: 10,
                            infantAgeLimit: 3,
                            isVat: true,
                            vat: apiData[i].prices[0].vatAmount,
                            base: "person",
                            isSharedTransferAvailable: false,
                            isPrivateTransferAvailable: false,
                            privateTransfers: [
                                {
                                    name: "Dubai Park",
                                    maxCapacity: 1,
                                    price: apiData[i].prices[0].totalPrice,
                                    cost: apiData[i].prices[0].totalPrice,
                                },
                            ],
                        });

                        await newActivity.save();
                        activities.push(newActivity);
                    } else {
                        activity.childCost = apiData[i].prices[0].totalPrice;
                        activity.adultCost = apiData[i].prices[0].totalPrice;
                        activity.isApiSync = true;
                        await activity.save();
                        activities.push(activity);
                    }
                }

                let balanceDetails = await getBalance(res, attr.connectedApi);

                console.log(balanceDetails, "balanceDetails");

                res.status(200).json({
                    message: "Updated Successfully",
                    activities: activities,
                });
            } else {
                let activities = [];

                let apiData;

                let res = await AuthenticationRequest();
                if (attr.isApiConnected) {
                    apiData = await getAgentTickets(res);
                }

                console.log(apiData, "apiData");

                for (i = 0; i < apiData.length; i++) {
                    let activity = null;

                    activity = await AttractionActivity.findOne({
                        attraction: attr._id,
                        productId: apiData[i].ResourceID,
                        productCode: apiData[i].EventtypeId,
                    });

                    let apiPriceData = await getLeastPriceOfDay(apiData[i]);

                    console.log(apiPriceData, activity, "apiPriceData");

                    if (activity == null && apiPriceData !== undefined) {
                        console.log("call reached 1");
                        let newActivity = new AttractionActivity({
                            name: apiData[i].AttractionName,
                            attraction: attr._id,
                            activityType: "normal",
                            productId: apiData[i].ResourceID,
                            productCode: apiData[i].EventtypeId,
                            // ResourceID: apiData[i].ResourceID,
                            // EventtypeId: apiData[i].EventtypeId,
                            childCost: apiPriceData.leastAdultPrice,
                            adultCost: apiPriceData.leastChildPrice,
                            childPrice: apiPriceData.leastChildPrice,
                            adultPrice: apiPriceData.leastAdultPrice,
                            adultAgeLimit: 60,
                            childAgeLimit: 10,
                            infantAgeLimit: 3,
                            isVat: false,
                            isApiSync: true,
                            base: "person",
                            isSharedTransferAvailable: false,
                            isPrivateTransferAvailable: false,
                            privateTransfers: [
                                {
                                    name: "Burj Khalifa",
                                    maxCapacity: 1,
                                    price: apiPriceData.leastChildPrice,
                                    cost: apiPriceData.leastChildPrice,
                                },
                            ],
                        });

                        await newActivity.save();
                        activities.push(newActivity);
                    } else if (apiPriceData !== undefined) {
                        console.log("call reached 2");

                        activity.childPrice = apiPriceData.leastChildPrice;
                        activity.adultPrice = apiPriceData.leastAdultPrice;
                        activity.isApiSync = true;

                        await activity.save();
                        activities.push(activity);
                    }
                    console.log("call reached 3");
                }

                res.status(200).json({
                    message: "Updated Successfully",
                    activities: activities,
                });
            }
        } catch (err) {
            console.log(err.message, "err");
            sendErrorResponse(res, 500, err);
        }
    },

    addAttractionActivity: async (req, res) => {
        try {
            let {
                attraction,
                name,
                description,
                activityType,
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
                isSharedTransferAvailable,
                sharedTransferPrice,
                sharedTransferCost,
                isPrivateTransferAvailable,
                privateTransfers,
                isActive,
                peakTime,
                note,
                childCost,
                adultCost,
                infantCost,
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

            let apiData;
            if (attr.isApiConnected) {
                apiData = await attractionApi(res, attr.connectedApi);
                adultCost = apiData;
                childCost = apiData;
            }

            if (attr.bookingType === "ticket" && activityType === "transfer") {
                return sendErrorResponse(
                    res,
                    400,
                    "you can't add transfer only activity in ticket attraction"
                );
            }

            if (activityType === "transfer") {
                if (
                    isSharedTransferAvailable === false &&
                    isPrivateTransferAvailable === false
                ) {
                    return sendErrorResponse(
                        res,
                        400,
                        "shared or private transfer is required for transfer type"
                    );
                }
            }

            let isPriceRequired = true;
            let isCostRequired = true;
            if (activityType === "transfer") {
                isPriceRequired = false;
                isCostRequired = false;
            } else if (attr.bookingType === "ticket") {
                isCostRequired = false;
            }

            const newTicket = new AttractionActivity({
                attraction,
                name,
                activityType,
                description,
                adultAgeLimit,
                childAgeLimit,
                infantAgeLimit,
                adultPrice: isPriceRequired ? adultPrice : "",
                childPrice: isPriceRequired ? childPrice : "",
                infantPrice: isPriceRequired ? infantPrice : "",
                adultCost: isCostRequired ? adultCost : "",
                childCost: isCostRequired ? childCost : "",
                infantCost: isCostRequired ? infantCost : "",
                isCancelable,
                isVat,
                vat: isVat && vat,
                base,
                isSharedTransferAvailable,
                sharedTransferPrice:
                    isSharedTransferAvailable && sharedTransferPrice,
                sharedTransferCost:
                    isSharedTransferAvailable && sharedTransferCost,
                isPrivateTransferAvailable,
                privateTransfers,
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

    updateActivity: async (req, res) => {
        try {
            const { activityId } = req.params;
            const {
                name,
                description,
                activityType,
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
                isSharedTransferAvailable,
                sharedTransferPrice,
                sharedTransferCost,
                isPrivateTransferAvailable,
                privateTransfers,
                isActive,
                peakTime,
                note,
                childCost,
                adultCost,
                infantCost,
                attraction,
            } = req.body;

            const { _, error } = attractionActivitySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(activityId)) {
                return sendErrorResponse(res, 400, "Invalid activity id");
            }

            if (!isValidObjectId(attraction)) {
                return sendErrorResponse(res, 400, "invalid attraction id");
            }

            const attr = await Attraction.findOne({
                _id: attraction,
                isDeleted: false,
            });
            if (!attr) {
                return sendErrorResponse(res, 400, "attraction not found");
            }

            if (attr.bookingType === "ticket" && activityType === "transfer") {
                return sendErrorResponse(
                    res,
                    400,
                    "you can't add transfer only activity in ticket attraction"
                );
            }

            if (activityType === "transfer") {
                if (
                    isSharedTransferAvailable === false &&
                    isPrivateTransferAvailable === false
                ) {
                    return sendErrorResponse(
                        res,
                        400,
                        "shared or private transfer is required for transfer type"
                    );
                }
            }

            let isPriceRequired = true;
            let isCostRequired = true;
            if (activityType === "transfer") {
                isPriceRequired = false;
                isCostRequired = false;
            } else if (attr.bookingType === "ticket" && !attr.isApiConnected) {
                isCostRequired = false;
            }

            const activity = await AttractionActivity.findOneAndUpdate(
                {
                    isDeleted: false,
                    _id: activityId,
                },
                {
                    name,
                    activityType,
                    description,
                    adultAgeLimit,
                    childAgeLimit,
                    infantAgeLimit,
                    adultPrice: isPriceRequired ? adultPrice : "",
                    childPrice: isPriceRequired ? childPrice : "",
                    infantPrice: isPriceRequired ? infantPrice : "",
                    adultCost: isCostRequired ? adultCost : "",
                    childCost: isCostRequired ? childCost : "",
                    infantCost: isCostRequired ? infantCost : "",
                    isCancelable,
                    isVat,
                    vat: isVat && vat,
                    base,
                    isSharedTransferAvailable,
                    sharedTransferPrice:
                        isSharedTransferAvailable && sharedTransferPrice,
                    sharedTransferCost:
                        isSharedTransferAvailable && sharedTransferCost,
                    isActive,
                    peakTime,
                    note,
                    isPrivateTransferAvailable,
                    privateTransfers: isPrivateTransferAvailable
                        ? privateTransfers
                        : [],
                },
                { runValidators: true }
            );

            if (!activity) {
                return sendErrorResponse(res, 404, "Activity not found");
            }

            res.status(200).json({
                message: "Activity successfully updated",
                _id: activityId,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllAttractions: async (req, res) => {
        try {
            const { skip = 0, limit = 10, search } = req.query;

            const filters = { isDeleted: false };

            if (search && search !== "") {
                filters.title = { $regex: search, $options: "i" };
            }

            const attractions = await Attraction.aggregate([
                { $match: filters },
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
                    $lookup: {
                        from: "b2cattractionmarkups",
                        localField: "_id",
                        foreignField: "attraction",
                        as: "markup",
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
                        markup: { $arrayElemAt: ["$markup", 0] },
                    },
                },
                {
                    $project: {
                        title: 1,
                        bookingType: 1,
                        isOffer: 1,
                        isApiConnected: 1,
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
                        markup: 1,
                        isActive: true,
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $skip: Number(limit) * Number(skip),
                },
                {
                    $limit: Number(limit),
                },
            ]);

            const totalAttractions = await Attraction.find(filters).count();

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

            const attraction = await Attraction.aggregate([
                { $match: { _id: Types.ObjectId(id), isDeleted: false } },
                {
                    $lookup: {
                        from: "attractionactivities",
                        foreignField: "attraction",
                        localField: "_id",
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
                    },
                },
            ]);

            if (!attraction || attraction?.length < 1) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            res.status(200).json(attraction[0]);
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

    getSingleActivity: async (req, res) => {
        try {
            const { activityId } = req.params;

            if (!isValidObjectId(activityId)) {
                return sendErrorResponse(res, 400, "Invalid activity id");
            }

            const activity = await AttractionActivity.findOne({
                isDeleted: false,
                _id: activityId,
            }).populate("attraction", "title bookingType isApiConnected");

            if (!activity) {
                return sendErrorResponse(res, 404, "Activity not found");
            }

            res.status(200).json(activity);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteActivity: async (req, res) => {
        try {
            const { activityId } = req.params;

            if (!isValidObjectId(activityId)) {
                return sendErrorResponse(res, 400, "Invalid activity id");
            }

            const activity = await AttractionActivity.findOneAndUpdate(
                {
                    isDeleted: false,
                    _id: activityId,
                },
                { isDeleted: true }
            );

            if (!activity) {
                return sendErrorResponse(res, 404, "Activity not found");
            }

            res.status(200).json({
                message: "Activity successfully deleted",
                _id: activityId,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleAttractionBasicData: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid Attraction Id");
            }

            const attraction = await Attraction.findOne({
                isDeleted: false,
                _id: id,
            }).select("title bookingType");
            if (!attraction) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            res.status(200).json(attraction);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteAttractionReview: async (req, res) => {
        try {
            const { reviewId } = req.params;

            if (!isValidObjectId(reviewId)) {
                return sendErrorResponse(res, 400, "Invalid Review Id");
            }

            const review = await AttractionReview.findByIdAndDelete(reviewId);

            if (!review) {
                return sendErrorResponse(res, 404, "Review not found");
            }

            res.status(200).json({
                message: "Review successfully deleted",
                reviewId,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateAttractionIsActiveOrNot: async (req, res) => {
        try {
            const { isActive } = req.body;
            const { id } = req.params;

            if (!isValidObjectId) {
                return sendErrorResponse(res, 400, "invalid attraction id");
            }

            const attraction = await Attraction.findOneAndUpdate(
                { _id: id, isDeleted: false },
                { isActive },
                { runValidators: true }
            );

            if (!attraction) {
                return sendErrorResponse(
                    res,
                    404,
                    "attraction not found or deleted."
                );
            }

            res.status(200).json({
                message: "attraction's status updated successfully",
                _id: id,
                isActive,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllAttractionAndActivitiesNames: async (req, res) => {
        try {
            const attractions = await Attraction.find({ isDeleted: false })
                .select({ title: 1, itineraryDescription: 1, images: 1 })
                .sort({ title: 1 })
                .collation({ locale: "en", caseLevel: true });
            const activities = await AttractionActivity.find({
                isDeleted: false,
            })
                .select("name attraction")
                .sort({ name: 1 })
                .collation({ locale: "en", caseLevel: true });

            res.status(200).json({ attractions, activities });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
