const { isValidObjectId } = require("mongoose");

const {
    b2bAttractionOrderSchema,
} = require("../validations/b2bAttractionOrder.schema");
const {
    sendErrorResponse,
    sendMobileOtp,
    sendEmail,
} = require("../../helpers");
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
    // TODO
    // 1. VAT
    // 2. Offer
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

                if (new Date(selectedActivities[i]?.date) < new Date()) {
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

                totalAmount += price;
            }

            const otp = await sendMobileOtp(
                countryDetail.phonecode,
                phoneNumber
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

            res.status(200).json({
                message: "order successfully placed",
                referenceNumber: attractionOrder.referenceNumber,
            });
        } catch (err) {
            sendErrorResponse(res, 400, err);
        }
    },
};

//             sendEmail(
//                 "lekhraj@hami.live",
//                 "New Order placed",
//                 `Reference No: ${attractionOrder.referenceNumber}
// Amount: ${attractionOrder.totalAmount}
// Activities: ${attractionOrder.activities.length}

// name: ${attractionOrder.name}
// email: ${attractionOrder.email}
// phoneNumber: ${attractionOrder.phoneNumber}`
//             );

//             sendEmail(
//                 "experiences@travellerschoice.ae",
//                 "New Order placed",
//                 `Reference No: ${attractionOrder.referenceNumber}
// Amount: ${attractionOrder.totalAmount}
// Activities: ${attractionOrder.activities.length}

// name: ${attractionOrder.name}
// email: ${attractionOrder.email}
// phoneNumber: ${attractionOrder.phoneNumber}`
//             );
