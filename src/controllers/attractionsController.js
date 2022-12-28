const { isValidObjectId, Types } = require("mongoose");
const crypto = require("crypto");
const { hash } = require("bcryptjs");

const { sendErrorResponse } = require("../helpers");
const {
    Attraction,
    AttractionActivity,
    AttractionOrder,
    AttractionTicket,
    User,
    AttractionReview,
} = require("../models/");
const {
    attractionOrderSchema,
} = require("../validations/attractionOrder.schema");

module.exports = {
    createAttractionOrder: async (req, res) => {
        try {
            const { attraction, selectedActivities } = req.body;

            const { _, error } = attractionOrderSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(attraction)) {
                return sendErrorResponse(res, 400, "Invalid Attraction Id");
            }

            const attr = await Attraction.findById(attraction);
            if (!attr) {
                return sendErrorResponse(res, 500, "Attraction not found!");
            }

            let totalAmount = 0;
            for (let i = 0; i < selectedActivities?.length; i++) {
                if (!isValidObjectId(selectedActivities[i]?.activity)) {
                    return sendErrorResponse(res, 400, "Invalid activity id");
                }

                const activity = await AttractionActivity.findById(
                    selectedActivities[i]?.activity
                );

                if (!activity) {
                    return sendErrorResponse(res, 400, "Activity not found!");
                }

                if (
                    new Date(selectedActivities[i]?.date) <
                        new Date(attr.startDate) ||
                    new Date(selectedActivities[i]?.date) >
                        new Date(attr.endDate)
                ) {
                    return sendErrorResponse(
                        res,
                        400,
                        "Please select a valid date. You are selected ann off day"
                    );
                }

                const arrIndex = attr.offDays?.findIndex((dt) => {
                    return (
                        new Date(dt).toDateString() ===
                        new Date(selectedActivities[i]?.date)?.toDateString()
                    );
                });

                if (arrIndex !== -1) {
                    return sendErrorResponse(
                        res,
                        400,
                        "Please select a valid date. You are selected an off day"
                    );
                }

                if (activity.bookingType === "ticket") {
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
                        return sendErrorResponse(
                            res,
                            400,
                            "Sorry, Adult Ticket sold out"
                        );
                    }

                    if (
                        childrenTickets <
                        Number(selectedActivities[i]?.childrenCount)
                    ) {
                        return sendErrorResponse(
                            res,
                            400,
                            "Sorry, Children Ticket sold out"
                        );
                    }
                }

                if (selectedActivities[i]?.adultsCount && activity.adultPrice) {
                    totalAmount +=
                        Number(selectedActivities[i]?.adultsCount) *
                        activity.adultPrice;
                }
                if (
                    selectedActivities[i]?.childrenCount &&
                    activity?.childPrice
                ) {
                    totalAmount +=
                        Number(selectedActivities[i]?.childrenCount) *
                        activity?.childPrice;
                }
                if (
                    selectedActivities[i]?.infantCount &&
                    activity?.infantPrice
                ) {
                    totalAmount +=
                        Number(selectedActivities[i]?.infantCount) *
                        activity?.infantPrice;
                }

                if (selectedActivities[i]?.transferType === "private") {
                    if (
                        activity.isTransferAvailable &&
                        activity.privateTransferPrice
                    ) {
                        if (selectedActivities[i]?.adultsCount) {
                            totalAmount +=
                                Number(selectedActivities[i]?.adultsCount) *
                                activity.privateTransferPrice;
                        }
                        if (selectedActivities[i]?.childrenCount) {
                            totalAmount +=
                                Number(selectedActivities[i]?.childrenCount) *
                                activity.privateTransferPrice;
                        }
                    } else {
                        return sendErrorResponse(
                            res,
                            400,
                            "Private transfer not available for an activity"
                        );
                    }
                }

                if (selectedActivities[i]?.transferType === "shared") {
                    if (
                        activity.isTransferAvailable &&
                        activity.sharedTransferPrice
                    ) {
                        if (selectedActivities[i]?.adultsCount) {
                            totalAmount +=
                                Number(selectedActivities[i]?.adultsCount) *
                                activity.sharedTransferPrice;
                        }
                        if (selectedActivities[i]?.childrenCount) {
                            totalAmount +=
                                Number(selectedActivities[i]?.childrenCount) *
                                activity.sharedTransferPrice;
                        }
                    } else {
                        return sendErrorResponse(
                            res,
                            400,
                            "Shared Transfer not available for an activity"
                        );
                    }
                }
            }

            let offer = 0;
            if (attr?.isOffer) {
                if (attr.offerAmountType === "flat") {
                    offer = attr.offerAmount;
                    totalAmount -= attr.offerAmount;
                } else {
                    offer = (totalAmount / 100) * attr.offerAmount;
                    totalAmount -= offer;
                }
            }

            const newAttractionOrder = new AttractionOrder({
                attraction,
                orders: selectedActivities,
                totalAmount,
                offerAmount: offer,
                user: req.user?._id || undefined,
                status: "pending",
                bookingType: attr.bookingType,
            });
            await newAttractionOrder.save();

            res.status(200).json(newAttractionOrder);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    createPaymentOrder: async (req, res) => {
        try {
            const { attractionOrderId, name, email, phoneNumber, country } =
                req.body;

            if (!isValidObjectId(attractionOrderId)) {
                return sendErrorResponse(res, 400, "Invalid order id");
            }

            const attractionOrder = await AttractionOrder.findById(
                attractionOrderId
            );
            if (!attractionOrder) {
                return sendErrorResponse(res, 404, "Order not found");
            }

            for (let i = 0; i < attractionOrder.orders?.length; i++) {
                let order = attractionOrder.orders[i];

                // add reserve ticket condition
                if (order.bookingType === "ticket") {
                    const adultTickets = await AttractionTicket.find({
                        activity: order.activity,
                        status: "ok",
                        ticketFor: "adult",
                        $or: [
                            {
                                validity: true,
                                validTill: {
                                    $gte: new Date(order.date).toISOString(),
                                },
                            },
                            { validity: false },
                        ],
                    }).count();
                    const childrenTickets = await AttractionTicket.find({
                        activity: order.activity,
                        status: "ok",
                        ticketFor: "child",
                        $or: [
                            {
                                validity: true,
                                validTill: {
                                    $gte: new Date(order.date).toISOString(),
                                },
                            },
                            { validity: false },
                        ],
                    }).count();

                    if (order?.adultsCount > adultTickets) {
                        return sendErrorResponse(
                            res,
                            400,
                            "Sorry, Adult Tickets sold out"
                        );
                    }
                    if (order?.childrenCount > childrenTickets) {
                        return sendErrorResponse(
                            res,
                            400,
                            "Sorry, Adult Tickets sold out"
                        );
                    }
                }
            }

            if (!req.user) {
                const user = await User.findOne({
                    email,
                });
                if (user) {
                    return sendErrorResponse(
                        res,
                        400,
                        "You have already an account with this email, please login."
                    );
                }

                const password = crypto.randomBytes(6);
                const hashedPassowrd = await hash(password, 8);

                const newUser = new User({
                    name,
                    email,
                    phoneNumber,
                    country,
                    isGuestUser: true,
                    password: hashedPassowrd,
                });
                await newUser.save();
            }

            let adultTickets = [];
            let childTickets = [];
            for (let i = 0; i < attractionOrder.orders?.length; i++) {
                let order = attractionOrder.orders[i];

                if (order.bookingType === "ticket") {
                    for (let i = 0; i < order.adultsCount; i++) {
                        const ticket = await AttractionTicket.findOneAndUpdate(
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
                                404,
                                "Sorry, Tickets sold out"
                            );
                        }
                        adultTickets.push(ticket._id);
                    }

                    for (let i = 0; i < order.childrenCount; i++) {
                        const ticket = await AttractionTicket.findOneAndUpdate(
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
                                "Sorry, Tickets sold out"
                            );
                        }
                        childTickets.push(ticket._id);
                    }
                }
                // attractionOrder.orders[i].status === "booked"
            }

            res.status(200).json({});
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    capturePayment: async (req, res) => {
        try {
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

            const attraction = await Attraction.findById(id)
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
};
