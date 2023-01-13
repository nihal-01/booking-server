const { isValidObjectId } = require("mongoose");
const crypto = require("crypto");

const { sendErrorResponse } = require("../helpers");
const {
    Attraction,
    AttractionActivity,
    AttractionOrder,
    AttractionTicket,
    User,
    Country,
    Payment,
} = require("../models/");
const {
    attractionOrderSchema,
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
                                adultTicketError && childTicketError
                                    ? "and"
                                    : ""
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

                if (attraction.bookingType === "booking") {
                    let totalAdultPurchaseCost = 0;
                    if (selectedActivities[i]?.adultsCount >= 1) {
                        totalAdultPurchaseCost =
                            (selectedActivities[i]?.adultsCount || 0) *
                            (activity.adultCost || 0);
                    }
                    let totalChildPurchaseCost = 0;
                    if (selectedActivities[i]?.childrenCount >= 1) {
                        totalChildPurchaseCost =
                            (selectedActivities[i]?.childrenCount || 0) *
                            (activity.childCost || 0);
                    }
                    let totalInfantPurchaseCost = 0;
                    if (selectedActivities[i]?.infantCount >= 1) {
                        totalInfantPurchaseCost =
                            (selectedActivities[i]?.infantCount || 0) *
                            (activity.infantCost || 0);
                    }

                    let profit =
                        price -
                        (totalAdultPurchaseCost +
                            totalChildPurchaseCost +
                            totalInfantPurchaseCost);

                    selectedActivities[i].profit = profit;
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

                selectedActivities[i].amount = price;
                selectedActivities[i].offerAmount = offer;
                selectedActivities[i].status = "pending";
                selectedActivities[i].bookingType = attraction.bookingType;
                if (attraction.bookingType === "booking") {
                    selectedActivities[i].adultCost = activity.adultCost;
                    selectedActivities[i].childCost = activity.childCost;
                    selectedActivities[i].infantCost = activity.infantCost;
                }
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

            const currency = "USD";
            const response = await createOrder(totalAmount, currency);

            if (response.statusCode !== 201) {
                return sendErrorResponse(
                    res,
                    400,
                    "Something went wrong while fetching order! Please try again later"
                );
            }

            let buyer = req.user || user;

            const newAttractionOrder = new AttractionOrder({
                activities: selectedActivities,
                totalAmount,
                totalOffer,
                user: buyer?._id,
                country: buyer?.country,
                name: buyer?.name,
                email: buyer?.email,
                phoneNumber: buyer?.phoneNumber,
                orderStatus: "created",
                paymentStatus: "PENDING",
                paymentOrderId: response.result.id,
                merchant: "Paypal",
            });
            await newAttractionOrder.save();

            res.status(200).json(response.result);
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

            const attractionOrder = await AttractionOrder.findOne({
                paymentOrderId: orderId,
            });
            if (!attractionOrder) {
                return sendErrorResponse(
                    res,
                    400,
                    "Attraction order not found!. Check with XYZ team if amount is debited from your bank!"
                );
            }

            if (attractionOrder.orderStatus === "completed") {
                return sendErrorResponse(
                    res,
                    400,
                    "This order already completed, Thank you"
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
                return sendErrorResponse(
                    res,
                    400,
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
                        paymentOrderId: orderId,
                        user: attractionOrder.user,
                        orderType: "attraction",
                        order: attractionOrder._id,
                        paymentDetails: paymentObject.result,
                    });
                    await payment.save();

                    for (
                        let i = 0;
                        i < attractionOrder.activities?.length;
                        i++
                    ) {
                        let activity = attractionOrder.activities[i];

                        if (activity.bookingType === "ticket") {
                            let adultTickets = [];
                            let childTickets = [];
                            let totalAdultPurchaseCost = 0;
                            let totalChildPurchaseCost = 0;

                            for (let i = 0; i < activity.adultsCount; i++) {
                                const ticket =
                                    await AttractionTicket.findOneAndUpdate(
                                        {
                                            activity: activity.activity,
                                            status: "ok",
                                            ticketFor: "adult",
                                            $or: [
                                                {
                                                    validity: true,
                                                    validTill: {
                                                        $gte: new Date(
                                                            activity.date
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
                                    cost: ticket?.ticketCost,
                                });
                                totalAdultPurchaseCost += ticket?.ticketCost;
                            }

                            for (let i = 0; i < activity.childrenCount; i++) {
                                const ticket =
                                    await AttractionTicket.findOneAndUpdate(
                                        {
                                            activity: activity.activity,
                                            status: "ok",
                                            ticketFor: "child",
                                            $or: [
                                                {
                                                    validity: true,
                                                    validTill: {
                                                        $gte: new Date(
                                                            activity.date
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
                                    cost: ticket?.ticketCost,
                                });
                                totalChildPurchaseCost += ticket?.ticketCost;
                            }

                            attractionOrder.activities[i].adultTickets =
                                adultTickets;
                            attractionOrder.activities[i].childTickets =
                                childTickets;
                            attractionOrder.activities[i].profit =
                                attractionOrder.activities[i].amount -
                                (totalAdultPurchaseCost +
                                    totalChildPurchaseCost);
                            attractionOrder.activities[i].status = "confirmed";
                        } else {
                            attractionOrder.activities[i].status = "booked";
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
            console.log(error);
            return sendErrorResponse(
                res,
                400,
                "Payment processing failed! If money is deducted contact XYZ team, else try again!"
            );
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
};