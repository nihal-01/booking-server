const { isValidObjectId, Types } = require("mongoose");
const crypto = require("crypto");

const { sendErrorResponse } = require("../helpers");
const {
    Attraction,
    AttractionActivity,
    AttractionOrder,
    AttractionTicket,
    User,
    AttractionReview,
    Country,
    Payment,
    Destination,
} = require("../models/");
const {
    attractionOrderSchema,
    attractionOrderPaymentSchema,
    attractionOrderCaptureSchema,
} = require("../validations/attractionOrder.schema");
const { createOrder, fetchOrder, fetchPayment } = require("../utils/paypal");

const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

module.exports = {
    createAttractionOrder: async (req, res) => {
        try {
            const { selectedActivities, name, email, phoneNumber, country } =
                req.body;

            const { _, error } = attractionOrderSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            let totalAmount = 0;
            let totalOffer = 0;
            for (let i = 0; i < selectedActivities?.length; i++) {
                if (!isValidObjectId(selectedActivities[i]?.activity)) {
                    return sendErrorResponse(res, 400, "Invalid activity id");
                }

                const activity = await AttractionActivity.findOne({
                    _id: selectedActivities[i]?.activity,
                    isDeleted: false,
                });

                if (!activity) {
                    return sendErrorResponse(res, 400, "Activity not found!");
                }

                const attraction = await Attraction.findOne({
                    _id: activity.attraction,
                    isDeleted: false,
                });
                if (!attraction) {
                    return sendErrorResponse(res, 500, "Attraction not found!");
                }

                if (
                    attraction.isCustomDate === true &&
                    (new Date(selectedActivities[i]?.date) <
                        new Date(attraction?.startDate) ||
                        new Date(selectedActivities[i]?.date) >
                            new Date(attraction?.endDate))
                ) {
                    return sendErrorResponse(
                        res,
                        400,
                        `${
                            activity?.name
                        } is not avaialble on your date. Please select a date between ${new Date(
                            attraction?.startDate
                        )?.toDateString()} and ${new Date(
                            attraction?.endDate
                        )?.toDateString()} `
                    );
                }

                const selectedDay =
                    dayNames[new Date(selectedActivities[i]?.date).getDay()];

                const objIndex = attraction.availability?.findIndex((item) => {
                    return (
                        item?.day?.toLowerCase() === selectedDay?.toLowerCase()
                    );
                });

                if (
                    objIndex === -1 ||
                    attraction.availability[objIndex]?.isEnabled === false
                ) {
                    return sendErrorResponse(
                        res,
                        400,
                        `Sorry, ${activity?.name} is off on ${selectedDay}`
                    );
                }

                for (let j = 0; j < attraction.offDates?.length; j++) {
                    const { from, to } = attraction.offDates[j];
                    if (
                        new Date(selectedActivities[i]?.date) >=
                            new Date(from) &&
                        new Date(to) <= new Date(to)
                    ) {
                        return sendErrorResponse(
                            res,
                            400,
                            `${activity?.name} is off between ${new Date(
                                from
                            )?.toDateString()} and ${new Date(
                                to
                            )?.toDateString()} `
                        );
                    }
                }

                if (attraction.bookingType === "ticket") {
                    let adultTicketError = false;
                    let childTicketError = false;
                    const adultTickets = await AttractionTicket.find({
                        activity: activity._id,
                        status: "ok",
                        ticketFor: "adult",
                        $or: [
                            {
                                validity: true,
                                validTill: {
                                    $gte: new Date(
                                        selectedActivities[i]?.date
                                    ).toISOString(),
                                },
                            },
                            { validity: false },
                        ],
                    }).count();
                    const childrenTickets = await AttractionTicket.find({
                        activity: activity._id,
                        status: "ok",
                        ticketFor: "child",
                        $or: [
                            {
                                validity: true,
                                validTill: {
                                    $gte: new Date(
                                        selectedActivities[i]?.date
                                    ).toISOString(),
                                },
                            },
                            { validity: false },
                        ],
                    }).count();

                    if (
                        adultTickets <
                        Number(selectedActivities[i]?.adultsCount)
                    ) {
                        adultTicketError = true;
                    }

                    if (
                        childrenTickets <
                        Number(selectedActivities[i]?.childrenCount)
                    ) {
                        childTicketError = true;
                    }

                    if (adultTicketError || childTicketError) {
                        return sendErrorResponse(
                            res,
                            500,
                            `${adultTicketError && "Adult Tickets"} ${
                                adultTicketError && childTicketError && "and"
                            } ${childTicketError && "Child Tickets"} Sold Out`
                        );
                    }
                }

                let price = 0;
                if (selectedActivities[i]?.adultsCount && activity.adultPrice) {
                    price +=
                        Number(selectedActivities[i]?.adultsCount) *
                        activity.adultPrice;
                }
                if (
                    selectedActivities[i]?.childrenCount &&
                    activity?.childPrice
                ) {
                    price +=
                        Number(selectedActivities[i]?.childrenCount) *
                        activity?.childPrice;
                }
                if (
                    selectedActivities[i]?.infantCount &&
                    activity?.infantPrice
                ) {
                    price +=
                        Number(selectedActivities[i]?.infantCount) *
                        activity?.infantPrice;
                }

                if (selectedActivities[i]?.transferType === "private") {
                    if (
                        activity.isTransferAvailable &&
                        activity.privateTransferPrice
                    ) {
                        if (selectedActivities[i]?.adultsCount) {
                            price +=
                                Number(selectedActivities[i]?.adultsCount) *
                                activity.privateTransferPrice;
                        }
                        if (selectedActivities[i]?.childrenCount) {
                            price +=
                                Number(selectedActivities[i]?.childrenCount) *
                                activity.privateTransferPrice;
                        }
                    } else {
                        return sendErrorResponse(
                            res,
                            400,
                            `Private transfer not available for ${activity?.name}`
                        );
                    }
                }

                if (selectedActivities[i]?.transferType === "shared") {
                    if (
                        activity.isTransferAvailable &&
                        activity.sharedTransferPrice
                    ) {
                        if (selectedActivities[i]?.adultsCount) {
                            price +=
                                Number(selectedActivities[i]?.adultsCount) *
                                activity.sharedTransferPrice;
                        }
                        if (selectedActivities[i]?.childrenCount) {
                            price +=
                                Number(selectedActivities[i]?.childrenCount) *
                                activity.sharedTransferPrice;
                        }
                    } else {
                        return sendErrorResponse(
                            res,
                            400,
                            `Shared Transfer not available for ${activity?.name}`
                        );
                    }
                }

                let offer = 0;
                if (attraction?.isOffer) {
                    if (attraction.offerAmountType === "flat") {
                        offer = attraction.offerAmount;
                    } else {
                        offer = (price / 100) * attraction.offerAmount;
                    }
                }

                price -= offer;
                if (price < 0) {
                    price = 0;
                }
                selectedActivities[i].amount = price;
                selectedActivities[i].offerAmount = offer;
                selectedActivities[i].status = "pending";
                totalAmount += price;
                totalOffer += offer;
            }

            let user;
            if (!req.user) {
                if (!name || !email || !phoneNumber || !country) {
                    return sendErrorResponse(
                        res,
                        400,
                        "Please login or provide User details. (name, email, phoneNumber, country)"
                    );
                }

                if (!isValidObjectId(country)) {
                    return sendErrorResponse(res, 400, "Invalid country id");
                }

                const countryDetails = await Country.findOne({
                    _id: country,
                    isDeleted: false,
                });
                if (!countryDetails) {
                    return sendErrorResponse(res, 400, "Country not found");
                }

                user = await User.findOne({ email });
                if (!user) {
                    const password = crypto.randomBytes(6);
                    console.log(password);
                    user = new User({
                        name,
                        email,
                        phoneNumber,
                        country,
                        password,
                    });
                    await user.save();
                }
            }

            const newAttractionOrder = new AttractionOrder({
                activities: selectedActivities,
                totalAmount,
                totalOffer,
                user: req.user?._id || user?._id,
                orderStatus: "created",
            });
            await newAttractionOrder.save();

            res.status(200).json(newAttractionOrder);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    capturePayment: async (req, res) => {
        try {
            const { orderId, paymentId } = req.body;

            const { _, error } = attractionOrderCaptureSchema.validate(
                req.body
            );
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const attractionOrder = await AttractionOrder.findOne({ orderId });
            if (!attractionOrder) {
                return sendErrorResponse(
                    res,
                    400,
                    "Attraction order not found!. Check with XYZ team if amount is debited from your bank!"
                );
            }

            const orderObject = await fetchOrder(orderId);

            if (orderObject.statusCode == "500") {
                return sendErrorResponse(
                    res,
                    400,
                    "Error while fetching order status from paypal. Check with XYZ team if amount is debited from your bank!"
                );
            } else if (orderObject.status !== "COMPLETED") {
                return res
                    .status(400)
                    .json(
                        "Paypal order status is not Completed. Check with XYZ team if amount is debited from your bank!"
                    );
            } else {
                attractionOrder.paymentStatus = orderObject.status;
                attractionOrder.paymentId = paymentId;
                await attractionOrder.save();

                const paymentObject = await fetchPayment(paymentId);

                if (paymentObject.statusCode == "500") {
                    return sendErrorResponse(
                        res,
                        400,
                        "Error while fetching payment status from paypal. Check with XYZ team if amount is debited from your bank!"
                    );
                } else if (paymentObject.result.status !== "COMPLETED") {
                    return sendErrorResponse(
                        res,
                        400,
                        "Paypal payment status is not Completed. Please complete your payment!"
                    );
                } else {
                    const payment = new Payment({
                        merchant: "paypal",
                        paymentId,
                        orderId,
                        user: attractionOrder.user,
                        orderType: "attraction",
                        order: attractionOrder._id,
                        paymentDetails: paymentObject.result,
                    });
                    await payment.save();

                    let adultTickets = [];
                    let childTickets = [];
                    for (let i = 0; i < attractionOrder.orders?.length; i++) {
                        let order = attractionOrder.orders[i];

                        if (attractionOrder.bookingType === "ticket") {
                            for (let i = 0; i < order.adultsCount; i++) {
                                const ticket =
                                    await AttractionTicket.findOneAndUpdate(
                                        {
                                            activity: order.activity,
                                            status: "ok",
                                            ticketFor: "adult",
                                            $or: [
                                                {
                                                    validity: true,
                                                    validTill: {
                                                        $gte: new Date(
                                                            order.date
                                                        ).toISOString(),
                                                    },
                                                },
                                                { validity: false },
                                            ],
                                        },
                                        { status: "used" }
                                    );
                                if (!ticket) {
                                    return sendErrorResponse(
                                        res,
                                        400,
                                        "Ooh. sorry, We know you already paid. But tickets sold out. We are trying maximum to provide tickets for you. Otherwise amount will be refunded within 24hrs"
                                    );
                                }
                                adultTickets.push({
                                    ticketId: ticket._id,
                                    ticketNo: ticket?.ticketNo,
                                    lotNo: ticket?.lotNo,
                                    ticketFor: ticket?.ticketFor,
                                    validity: ticket.validity,
                                    validTill: ticket.validTill,
                                });
                            }

                            for (let i = 0; i < order.childrenCount; i++) {
                                const ticket =
                                    await AttractionTicket.findOneAndUpdate(
                                        {
                                            activity: order.activity,
                                            status: "ok",
                                            ticketFor: "child",
                                            $or: [
                                                {
                                                    validity: true,
                                                    validTill: {
                                                        $gte: new Date(
                                                            order.date
                                                        ).toISOString(),
                                                    },
                                                },
                                                { validity: false },
                                            ],
                                        },
                                        { status: "used" }
                                    );
                                if (!ticket) {
                                    return sendErrorResponse(
                                        res,
                                        404,
                                        "Ooh. sorry, We know you already paid. But tickets sold out. We are trying maximum to provide tickets for you. Otherwise amount will be refunded within 24hrs"
                                    );
                                }
                                childTickets.push({
                                    ticketId: ticket._id,
                                    ticketNo: ticket?.ticketNo,
                                    lotNo: ticket?.lotNo,
                                    ticketFor: ticket?.ticketFor,
                                    validity: ticket.validity,
                                    validTill: ticket.validTill,
                                });
                            }
                        }

                        attractionOrder.orders[i].adultTickets = adultTickets;
                        attractionOrder.orders[i].childTickets = childTickets;
                        if (attractionOrder.bookingType === "ticket") {
                            attractionOrder.orders[i].status = "confirmed";
                        } else {
                            attractionOrder.orders[i].status = "booked";
                        }
                    }

                    attractionOrder.orderStatus = "completed";
                    await attractionOrder.save();

                    return res.status(200).json({
                        message: "Transaction Successful",
                    });
                }
            }
        } catch (error) {
            return sendErrorResponse(
                res,
                400,
                "Payment processing failed! If money is deducted contact XYZ team, else try again!"
            );
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
                .populate("destination")
                .populate("category")
                .populate("activities")
                .lean();

            if (!attraction) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            const reviews = await AttractionReview.aggregate([
                { $match: { attraction: attraction._id } },
                {
                    $group: {
                        _id: "$attraction",
                        totalReviews: { $sum: 1 },
                        totalRating: { $sum: "$rating" },
                    },
                },
                {
                    $project: {
                        totalReviews: 1,
                        averageRating: {
                            $divide: ["$totalRating", "$totalReviews"],
                        },
                    },
                },
            ]);

            attraction.totalReviews = reviews[0]?.totalReviews || 0;
            attraction.averageRating = reviews[0]?.averageRating || 0;

            res.status(200).json(attraction);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleAttractionOrder: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attractionOrder = await AttractionOrder.findById(id)
                .populate("orders.activity")
                .populate(
                    "attraction",
                    "title isOffer offerAmount offerAmountType"
                )
                .lean();
            if (!attractionOrder) {
                return sendErrorResponse(res, 400, "Attraction not found");
            }

            res.status(200).json(attractionOrder);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllAttractions: async (req, res) => {
        try {
            const {
                skip = 0,
                limit = 10,
                category,
                destination,
                priceFrom,
                priceTo,
                rating,
            } = req.query;

            const filters1 = { isDeleted: false };
            const filters2 = {};

            if (category && category !== "") {
                if (!isValidObjectId(category)) {
                    return sendErrorResponse(res, 400, "Invalid category id");
                }

                filters1.category = category;
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

            if (priceFrom && priceFrom !== "") {
                filters2.activity.adultPrice = { $gte: priceFrom };
            }

            if (priceTo && priceTo !== "") {
                filters2.activity.adultPrice = { $lte: priceTo };
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
                                $sort: { createdAt: -1 },
                            },
                            {
                                $limit: 1,
                            },
                        ],
                        as: "activities",
                    },
                },
                {
                    $set: {
                        activity: { $arrayElemAt: ["$activities", 0] },
                    },
                },
                {
                    $match: filters2,
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
                {
                    $skip: Number(limit) * Number(skip),
                },
                {
                    $limit: Number(limit),
                },
            ]);

            res.status(200).json(attractions);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
