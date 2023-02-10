const { isValidObjectId, Types } = require("mongoose");

const {
    b2bAttractionOrderSchema,
} = require("../validations/b2bAttractionOrder.schema");
const { sendErrorResponse, sendMobileOtp } = require("../../helpers");
const {
    Attraction,
    AttractionActivity,
    Country,
    AttractionTicket,
} = require("../../models");
const {
    B2BClientAttractionMarkup,
    B2BSubAgentAttractionMarkup,
    B2BAttractionOrder,
    B2BWallet,
    B2BTransaction,
} = require("../models");
const {
    handleAttractionOrderMarkup,
} = require("../helpers/attractionOrderHelpers");
const { generateUniqueString } = require("../../utils");
const {
    getB2bOrders,
    generateB2bOrdersSheet,
} = require("../helpers/b2bOrdersHelper");
const sendAttractionOrderEmail = require("../helpers/sendAttractionOrderEmail");
const sendAttractionOrderAdminEmail = require("../helpers/sendAttractionOrderAdminEmail");
const sendAttractionOrderOtp = require("../helpers/sendAttractionOrderOtp");
const sendInsufficentBalanceMail = require("../helpers/sendInsufficentBalanceEmail");
const sendWalletDeductMail = require("../helpers/sendWalletDeductMail");

const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

// TODO
// 1. VAT
// 2. Offer
module.exports = {
    createAttractionOrder: async (req, res) => {
        try {
            const { selectedActivities, country, name, email, phoneNumber } =
                req.body;

            const { _, error } = b2bAttractionOrderSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(country)) {
                return sendErrorResponse(res, 400, "invalid country id");
            }

            const countryDetail = await Country.findOne({
                isDeleted: false,
                _id: country,
            });
            if (!countryDetail) {
                return sendErrorResponse(res, 404, "country not found");
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
                    return sendErrorResponse(res, 500, "attraction not found!");
                }

                if (
                    new Date(selectedActivities[i]?.date) <
                    new Date(new Date().setDate(new Date().getDate() + 2))
                ) {
                    return sendErrorResponse(
                        res,
                        400,
                        `"selectedActivities[${i}].date" must be a valid date`
                    );
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
                        `sorry, ${activity?.name} is off on ${selectedDay}`
                    );
                }

                for (let j = 0; j < attraction.offDates?.length; j++) {
                    const { from, to } = attraction.offDates[j];
                    if (
                        new Date(selectedActivities[i]?.date) >=
                            new Date(from) &&
                        new Date(selectedActivities[i]?.date) <= new Date(to)
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

                    if (adultTickets < selectedActivities[i]?.adultsCount) {
                        adultTicketError = true;
                    }

                    if (
                        childrenTickets < selectedActivities[i]?.childrenCount
                    ) {
                        childTicketError = true;
                    }

                    if (adultTicketError || childTicketError) {
                        return sendErrorResponse(
                            res,
                            500,
                            `${adultTicketError ? "Adult Tickets" : ""}${
                                adultTicketError && childTicketError
                                    ? " and "
                                    : ""
                            }${
                                childTicketError ? "Child Tickets" : ""
                            } Sold Out`
                        );
                    }
                }

                let price = 0;
                let totalResellerMarkup = 0;
                let totalSubAgentMarkup = 0;
                let markups = [];

                let resellerToSubAgentMarkup;
                let resellerToClientMarkup;
                if (req.reseller.role === "sub-agent") {
                    resellerToSubAgentMarkup =
                        await B2BSubAgentAttractionMarkup.findOne({
                            resellerId: req.reseller?.referredBy,
                            attraction: activity?.attraction,
                        });
                }
                resellerToClientMarkup =
                    await B2BClientAttractionMarkup.findOne({
                        resellerId: req.reseller?._id,
                        attraction: activity?.attraction,
                    });

                if (
                    selectedActivities[i]?.adultsCount > 0 &&
                    activity.adultPrice
                ) {
                    let adultPrice = activity.adultPrice;
                    if (resellerToSubAgentMarkup) {
                        let markup = 0;
                        if (resellerToSubAgentMarkup.markupType === "flat") {
                            markup = resellerToSubAgentMarkup.markup;
                        } else {
                            markup =
                                (resellerToSubAgentMarkup.markup *
                                    activity.adultPrice) /
                                100;
                        }

                        totalResellerMarkup +=
                            markup * selectedActivities[i]?.adultsCount;
                        adultPrice += markup;
                    }

                    if (resellerToClientMarkup) {
                        let markup = 0;
                        if (resellerToClientMarkup.markupType === "flat") {
                            markup = resellerToClientMarkup.markup;
                        } else {
                            markup =
                                (resellerToClientMarkup.markup * adultPrice) /
                                100;
                        }
                        totalSubAgentMarkup +=
                            markup * selectedActivities[i]?.adultsCount;
                        adultPrice += markup;
                    }

                    price += adultPrice * selectedActivities[i]?.adultsCount;
                }

                if (
                    selectedActivities[i]?.childrenCount > 0 &&
                    activity.childPrice
                ) {
                    let childPrice = activity.childPrice;
                    if (resellerToSubAgentMarkup) {
                        let markup = 0;
                        if (resellerToSubAgentMarkup.markupType === "flat") {
                            markup = resellerToSubAgentMarkup.markup;
                        } else {
                            markup =
                                (resellerToSubAgentMarkup.markup *
                                    activity?.childPrice) /
                                100;
                        }
                        totalResellerMarkup +=
                            markup * selectedActivities[i]?.childrenCount;
                        childPrice += markup;
                    }

                    if (resellerToClientMarkup) {
                        let markup = 0;
                        if (resellerToClientMarkup.markupType === "flat") {
                            markup = resellerToClientMarkup.markup;
                        } else {
                            markup =
                                (resellerToClientMarkup.markup * childPrice) /
                                100;
                        }
                        totalSubAgentMarkup +=
                            markup * selectedActivities[i]?.childrenCount;
                        childPrice += markup;
                    }

                    price += childPrice * selectedActivities[i]?.childrenCount;
                }

                if (
                    selectedActivities[i]?.infantCount > 0 &&
                    activity.infantPrice
                ) {
                    let infantPrice = activity.infantPrice;
                    if (resellerToSubAgentMarkup) {
                        let markup = 0;
                        if (resellerToSubAgentMarkup.markupType === "flat") {
                            markup = resellerToSubAgentMarkup.markup;
                        } else {
                            markup =
                                (resellerToSubAgentMarkup.markup *
                                    selectedActivities[i]?.infantPrice) /
                                100;
                        }
                        totalResellerMarkup +=
                            markup * selectedActivities[i]?.infantCount;
                        infantPrice += markup;
                    }

                    if (resellerToClientMarkup) {
                        let markup = 0;
                        if (resellerToClientMarkup.markupType === "flat") {
                            markup = resellerToClientMarkup.markup;
                        } else {
                            markup =
                                (resellerToClientMarkup.markup * infantPrice) /
                                100;
                        }
                        totalSubAgentMarkup +=
                            markup * selectedActivities[i]?.infantCount;
                        infantPrice += markup;
                    }

                    price += infantPrice * selectedActivities[i]?.infantCount;
                }

                let isExpiry = false;
                if (attraction.cancellationType !== "nonRefundable") {
                    isExpiry = true;
                }

                if (req.reseller.role === "sub-agent") {
                    markups.push({
                        to: req.reseller?.referredBy,
                        amount: totalResellerMarkup,
                        isExpiry,
                    });
                }
                markups.push({
                    to: req.reseller?._id,
                    amount: totalSubAgentMarkup,
                    isExpiry,
                });

                selectedActivities[i].amount = price;
                selectedActivities[i].offerAmount = 0;
                selectedActivities[i].status = "pending";
                selectedActivities[i].bookingType = attraction.bookingType;
                selectedActivities[i].resellerMarkup = totalResellerMarkup;
                selectedActivities[i].subAgentMarkup = totalSubAgentMarkup;
                selectedActivities[i].markups = markups;
                selectedActivities[i].attraction = attraction?._id;

                totalAmount += price;
            }

            const otp = await sendMobileOtp(
                countryDetail.phonecode,
                phoneNumber
            );

            sendAttractionOrderOtp(
                req.reseller.email,
                "Attraction Order Otp Verifiaction",
                otp
            );

            const attractionOrder = new B2BAttractionOrder({
                activities: selectedActivities,
                totalAmount,
                totalOffer,
                reseller: req.reseller?._id,
                country,
                name,
                email,
                phoneNumber,
                orderStatus: "pending",
                otp,
                referenceNumber: generateUniqueString("B2BATO"),
                orderedBy: req.reseller.role,
            });
            await attractionOrder.save();

            res.status(200).json(attractionOrder);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    completeAttractionOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { otp } = req.body;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "invalid order id");
            }

            const attractionOrder = await B2BAttractionOrder.findOne({
                _id: orderId,
                reseller: req.reseller._id,
            }).populate({
                path: "activities.activity",
                populate: {
                    path: "attraction",
                    populate: {
                        path: "destination",
                    },
                },
            });

            if (!attractionOrder) {
                return sendErrorResponse(
                    res,
                    404,
                    "attraction order not found"
                );
            }

            if (attractionOrder.orderStatus === "paid") {
                return sendErrorResponse(
                    res,
                    400,
                    "sorry, you have already completed this order!"
                );
            }

            if (!attractionOrder.otp || attractionOrder.otp !== Number(otp)) {
                return sendErrorResponse(res, 400, "incorrect otp!");
            }

            let totalAmount = attractionOrder.totalAmount;

            let wallet = await B2BWallet.findOne({
                reseller: req.reseller?._id,
            });
            if (!wallet || wallet.balance < totalAmount) {
                
                let reseller = req.reseller
                sendInsufficentBalanceMail(reseller)
                return sendErrorResponse(
                    res,
                    400,
                    "insufficient balance. please reacharge and try again"
                );
            }

            for (let i = 0; i < attractionOrder.activities?.length; i++) {
                const activity = await AttractionActivity.findOne({
                    _id: attractionOrder.activities[i].activity,
                });
                let totalPurchaseCost = 0;
                if (attractionOrder.activities[i].bookingType === "ticket") {
                    let adultTickets = [];
                    let childTickets = [];
                    let infantTickets = [];

                    for (
                        let j = 0;
                        j < attractionOrder.activities[i].adultsCount;
                        j++
                    ) {
                        const ticket = await AttractionTicket.findOneAndUpdate(
                            {
                                activity: activity._id,
                                status: "ok",
                                ticketFor: "adult",
                                $or: [
                                    {
                                        validity: true,
                                        validTill: {
                                            $gte: new Date(
                                                attractionOrder.activities[
                                                    i
                                                ].date
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
                                "tickets sold out."
                            );
                        }
                        adultTickets.push({
                            ticketId: ticket._id,
                            ticketNo: ticket?.ticketNo,
                            lotNo: ticket?.lotNo,
                            ticketFor: ticket?.ticketFor,
                            validity: ticket.validity,
                            validTill: ticket.validTill || undefined,
                            cost: ticket?.ticketCost,
                        });

                        totalPurchaseCost += ticket.ticketCost;
                    }

                    for (
                        let j = 0;
                        j < attractionOrder.activities[i].childrenCount;
                        j++
                    ) {
                        const ticket = await AttractionTicket.findOneAndUpdate(
                            {
                                activity:
                                    attractionOrder.activities[i].activity,
                                status: "ok",
                                ticketFor: "child",
                                $or: [
                                    {
                                        validity: true,
                                        validTill: {
                                            $gte: new Date(
                                                attractionOrder.activities[
                                                    i
                                                ].date
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
                            validTill: ticket.validTill || undefined,
                            cost: ticket?.ticketCost,
                        });

                        totalPurchaseCost += ticket.ticketCost;
                    }

                    if (activity.infantPrice > 0) {
                        for (
                            let j = 0;
                            j < attractionOrder.activities[i].childrenCount;
                            j++
                        ) {
                            const ticket =
                                await AttractionTicket.findOneAndUpdate(
                                    {
                                        activity:
                                            attractionOrder.activities[i]
                                                .activity,
                                        status: "ok",
                                        ticketFor: "infant",
                                        $or: [
                                            {
                                                validity: true,
                                                validTill: {
                                                    $gte: new Date(
                                                        attractionOrder.activities[
                                                            i
                                                        ].date
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
                            infantTickets.push({
                                ticketId: ticket._id,
                                ticketNo: ticket?.ticketNo,
                                lotNo: ticket?.lotNo,
                                ticketFor: ticket?.ticketFor,
                                validity: ticket.validity,
                                validTill: ticket.validTill || undefined,
                                cost: ticket?.ticketCost,
                            });

                            totalPurchaseCost += ticket.ticketCost;
                        }
                    }

                    attractionOrder.activities[i].adultTickets = adultTickets;
                    attractionOrder.activities[i].childTickets = childTickets;
                    attractionOrder.activities[i].infantTickets = infantTickets;
                    attractionOrder.activities[i].status = "confirmed";
                } else {
                    totalPurchaseCost =
                        activity.adultCost *
                            attractionOrder.activities[i].adultsCount +
                        (activity.childCost *
                            attractionOrder.activities[i].childrenCount || 0) +
                        (activity.infantCost *
                            attractionOrder.activities[i].childrenCount || 0);
                    attractionOrder.activities[i].status = "booked";
                }
                attractionOrder.activities[i].totalPurchaseCost =
                    totalPurchaseCost;
                attractionOrder.activities[i].profit =
                    attractionOrder.activities[i].amount -
                    (attractionOrder.activities[i].totalPurchaseCost +
                        (attractionOrder.activities[i].resellerMarkup || 0) +
                        (attractionOrder.activities[i].subAgentMarkup || 0));
            }

            const transaction = new B2BTransaction({
                reseller: req.reseller?._id,
                transactionType: "deduct",
                status: "pending",
                paymentProcessor: "wallet",
                amount: totalAmount,
                order: orderId,
            });
            await transaction.save();

            wallet.balance -= totalAmount;
            await wallet.save();
            
            let reseller = req.reseller
            sendWalletDeductMail( reseller  , attractionOrder )

            transaction.status = "success";
            await transaction.save();

            attractionOrder.phoneNumberVerified = true;
            attractionOrder.otp = "";
            attractionOrder.orderStatus = "paid";
            await attractionOrder.save();

            for (let i = 0; i < attractionOrder.activities?.length; i++) {
                if (attractionOrder.activities[i].bookingType === "ticket") {
                    await handleAttractionOrderMarkup(
                        attractionOrder._id,
                        attractionOrder.activities[i]
                    );
                }
            }

            console.log(attractionOrder, "attractionOrder");
            sendAttractionOrderEmail(req.reseller.email, attractionOrder);
            sendAttractionOrderAdminEmail(attractionOrder);

            res.status(200).json({
                message: "order successfully placed",
                referenceNumber: attractionOrder.referenceNumber,
                _id: attractionOrder?._id,
            });
        } catch (err) {
            sendErrorResponse(res, 400, err);
        }
    },

    getSingleB2bAllOrders: async (req, res) => {
        try {
            const { result, skip, limit } = await getB2bOrders({
                ...req.query,
                resellerId: req.reseller?._id,
                orderedBy: "",
                agentCode: "",
            });

            res.status(200).json({ result, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleB2bAllOrdersSheet: async (req, res) => {
        try {
            await generateB2bOrdersSheet({
                ...req.query,
                res,
                resellerId: req.reseller?._id,
                orderedBy: "",
                agentCode: "",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    cancelAttractionOrder: async (req, res) => {
        try {
            const { orderId, orderItemId } = req.body;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "invalid order id");
            }

            if (!isValidObjectId(orderItemId)) {
                return sendErrorResponse(res, 400, "invalid order item id");
            }

            // check order available or not
            const order = await B2BAttractionOrder.findOne(
                {
                    _id: orderId,
                    reseller: req.reseller?._id,
                },
                { activities: { $elemMatch: { _id: orderItemId } } }
            );

            if (!order || order?.activities?.length < 1) {
                return sendErrorResponse(res, 400, "order not found");
            }

            const attraction = await Attraction.findById(
                order.activities[0].attraction
            );
            if (!attraction) {
                return sendErrorResponse(res, 400, "attraction not found");
            }

            // check if it's status is booked or confirmed
            if (
                order.activities[0].status !== "booked" &&
                order.activities[0].status !== "confirmed"
            ) {
                return sendErrorResponse(
                    res,
                    400,
                    "you cantn't canel this order. order already cancelled or not completed the order"
                );
            }

            // check if it's ok for cancelling with cancellation policy
            if (attraction.cancellationType === "nonRefundable") {
                return sendErrorResponse(
                    res,
                    400,
                    "sorry, this order is non refundable"
                );
            }

            if (
                new Date(order.activities[0].date).setHours(0, 0, 0, 0) <=
                new Date().setDate(0, 0, 0, 0)
            ) {
                return sendErrorResponse(
                    res,
                    400,
                    "sorry, you cant't cancel the order after the activity date"
                );
            }

            let orderAmount = order.activities[0].amount;
            let cancellationFee = 0;
            let cancelBeforeDate = new Date(
                new Date(order.activities[0].date).setHours(0, 0, 0, 0)
            );
            cancelBeforeDate.setHours(
                cancelBeforeDate.getHours() - attraction.cancelBeforeTime
            );

            if (attraction.cancellationType === "freeCancellation") {
                if (new Date().setHours(0, 0, 0, 0) < cancelBeforeDate) {
                    cancellationFee = 0;
                } else {
                    cancellationFee =
                        (orderAmount / 100) * attraction.cancellationFee;
                }
            } else if (attraction.cancellationType === "cancelWithFee") {
                if (new Date().setHours(0, 0, 0, 0) < cancelBeforeDate) {
                    cancellationFee =
                        (orderAmount / 100) * attraction.cancellationFee;
                } else {
                    cancellationFee = totalAmount;
                }
            } else {
                return sendErrorResponse(
                    res,
                    400,
                    "sorry, cancellation failed"
                );
            }

            // Update tickets state to back
            if (order.activities[0].bookingType === "ticket") {
                await AttractionTicket.find({
                    activity: order.activities[0].activity,
                    ticketNo: { $all: order.activities[0].adultTickets },
                }).updateMany({ status: "ok" });
                await AttractionTicket.find({
                    activity: order.activities[0].activity,
                    ticketNo: { $all: order.activities[0].childTickets },
                }).updateMany({ status: "ok" });
                await AttractionTicket.find({
                    activity: order.activities[0].activity,
                    ticketNo: { $all: order.activities[0].infantTickets },
                }).updateMany({ status: "ok" });
            }

            // Refund the order amount after substracting fee
            let wallet = await B2BWallet.findOne({
                reseller: req.reseller?._id,
            });
            if (!wallet) {
                wallet = new B2BWallet({
                    balance: 0,
                    reseller: req.reseller?._id,
                });
                await wallet.save();
            }
            const newTransaction = new B2BTransaction({
                amount: orderAmount - cancellationFee,
                reseller: req.reseller?._id,
                transactionType: "refund",
                paymentProcessor: "wallet",
                order: orderId,
                orderItem: orderItemId,
                status: "pending",
            });
            await newTransaction.save();

            wallet.balance += newTransaction.amount;
            await wallet.save();
            newTransaction.status = "success";
            await newTransaction.save();

            // canecl the order item's markup transactions
            // for reseller and sub-agaents
            await B2BTransaction.find({
                transactionType: "markup",
                order: orderId,
                orderItem: orderItemId,
                status: "pending",
            }).updateMany({ status: "failed" });

            await B2BAttractionOrder.findOneAndUpdate(
                {
                    _id: orderId,
                    "activities._id": orderItemId,
                },
                {
                    "activities.$.status": "cancelled",
                },
                { runValidators: true }
            );

            res.status(200).json({
                message: "you have successfully cancelled the order",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleAttractionOrder: async (req, res) => {
        try {
            const { orderId } = req.params;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "invalid order id");
            }

            const order = await B2BAttractionOrder.aggregate([
                {
                    $match: {
                        _id: Types.ObjectId(orderId),
                        reseller: req.reseller?._id,
                        orderStatus: "paid",
                    },
                },
                {
                    $lookup: {
                        from: "countries",
                        localField: "country",
                        foreignField: "_id",
                        as: "country",
                    },
                },
                { $unwind: "$activities" },
                {
                    $lookup: {
                        from: "attractionactivities",
                        localField: "activities.activity",
                        foreignField: "_id",
                        as: "activities.activity",
                    },
                },
                {
                    $lookup: {
                        from: "attractions",
                        localField: "activities.attraction",
                        foreignField: "_id",
                        as: "activities.attraction",
                    },
                },
                {
                    $set: {
                        "activities.activity": {
                            $arrayElemAt: ["$activities.activity", 0],
                        },
                        "activities.attraction": {
                            $arrayElemAt: ["$activities.attraction", 0],
                        },
                        country: {
                            $arrayElemAt: ["$country", 0],
                        },
                    },
                },
                {
                    $project: {
                        referenceNumber: 1,
                        name: 1,
                        email: 1,
                        phoneNumber: 1,
                        orderStatus: 1,
                        totalAmount: 1,
                        totalOffer: 1,
                        country: 1,
                        activities: {
                            adultTickets: 1,
                            childrenTickets: 1,
                            infantTickets: 1,
                            status: 1,
                            amount: 1,
                            offerAmount: 1,
                            transferType: 1,
                            adultsCount: 1,
                            childrenCount: 1,
                            infantCount: 1,
                            date: 1,
                            bookingType: 1,
                            activity: {
                                name: 1,
                            },
                            attraction: {
                                title: 1,
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        activites: { $push: "$activities" },
                        totalAmount: { $first: "$totalAmount" },
                        referenceNumber: { $first: "$referenceNumber" },
                        name: { $first: "$name" },
                        email: { $first: "$email" },
                        phoneNumber: { $first: "$phoneNumber" },
                        orderStatus: { $first: "$orderStatus" },
                        totalOffer: { $first: "$totalOffer" },
                        country: { $first: "$country" },
                    },
                },
            ]);

            if (!order || order?.length < 1) {
                return sendErrorResponse(res, 404, "order not found");
            }

            res.status(200).json(order[0]);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
