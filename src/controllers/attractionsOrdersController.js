const { isValidObjectId } = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const nodeCCAvenue = require("node-ccavenue");

const { sendErrorResponse } = require("../helpers");
const {
    Attraction,
    AttractionActivity,
    AttractionOrder,
    AttractionTicket,
    User,
    Country,
    B2CAttractionMarkup,
    B2CTransaction,
    Refund,
    B2CBankDetails,
} = require("../models");
const {
    attractionOrderSchema,
} = require("../validations/attractionOrder.schema");
const { createOrder, fetchOrder, fetchPayment } = require("../utils/paypal");
const { generateUniqueString } = require("../utils");
const { convertCurrency } = require("../b2b/helpers/currencyHelpers");
const {
    completeOrderAfterPayment,
} = require("../helpers/attractionOrderHelpers");

const { getUserOrder } = require("../helpers/userOrderHelper");

const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const ccav = new nodeCCAvenue.Configure({
    merchant_id: process.env.CCAVENUE_MERCHANT_ID,
    working_key: process.env.CCAVENUE_WORKING_KEY,
});

module.exports = {
    createAttractionOrder: async (req, res) => {
        try {
            const {
                selectedActivities,
                name,
                email,
                phoneNumber,
                country,
                paymentProcessor,
            } = req.body;

            const { _, error } = attractionOrderSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            let totalAmount = 0;
            let totalOfferAmount = 0;
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
                    isActive: true,
                });
                if (!attraction) {
                    return sendErrorResponse(res, 500, "attraction not found!");
                }

                if (
                    new Date(selectedActivities[i]?.date).setHours(
                        0,
                        0,
                        0,
                        0
                    ) <= new Date().setHours(0, 0, 0, 0)
                ) {
                    return sendErrorResponse(
                        res,
                        400,
                        `"selectedActivities[${i}].date" must be a valid date`
                    );
                }

                if (
                    attraction.bookingType === "booking" &&
                    attraction.bookingPriorDays
                ) {
                    if (
                        new Date(selectedActivities[i]?.date).setHours(
                            0,
                            0,
                            0,
                            0
                        ) <
                        new Date(
                            new Date().setDate(
                                new Date().getDate() +
                                    Number(attraction.bookingPriorDays)
                            )
                        ).setHours(0, 0, 0, 0)
                    ) {
                        return sendErrorResponse(
                            res,
                            400,
                            `"selectedActivities[${i}].date" must be a valid date`
                        );
                    }
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

                let b2cMarkup = await B2CAttractionMarkup.findOne({
                    attraction: attraction?._id,
                });
                let adultActivityPrice = activity.adultPrice;
                let childActivityPrice = activity.childPrice;
                let infantActivityPrice = activity.infantPrice;
                let adultActivityTotalPrice = 0;
                let childActivityTotalPrice = 0;
                let infantActivityTotalPrice = 0;
                let adultActivityTotalCost = 0;
                let childActivityTotalCost = 0;
                let infantActivityTotalCost = 0;
                let sharedTransferPrice = activity.sharedTransferPrice;
                let sharedTransferTotalPrice = 0;
                let sharedTransferTotalCost = 0;
                let privateTransfers = [];
                let privateTransfersTotalPrice = 0;
                let privateTransfersTotalCost = 0;
                let totalPax =
                    (Number(selectedActivities[i]?.adultsCount) || 0) +
                    (Number(selectedActivities[i]?.childrenCount) || 0);
                let totalWithoutOffer = 0;
                let offerAmount = 0;
                let grandTotal = 0;

                if (activity?.activityType === "transfer") {
                    if (attraction.bookingType === "ticket") {
                        return sendErrorResponse(
                            res,
                            4000,
                            "sorry, this attraction not available at this momemnt"
                        );
                    }
                    if (selectedActivities[i]?.transferType === "without") {
                        return sendErrorResponse(
                            res,
                            400,
                            "please select a transfer option."
                        );
                    } else if (
                        selectedActivities[i]?.transferType === "shared"
                    ) {
                        if (
                            activity.isSharedTransferAvailable === false ||
                            !sharedTransferPrice ||
                            !activity.sharedTransferCost
                        ) {
                            return sendErrorResponse(
                                res,
                                400,
                                "this activity doesn't have a shared transfer option"
                            );
                        }

                        if (b2cMarkup) {
                            let markup = 0;
                            if (b2cMarkup.markupType === "flat") {
                                markup = b2cMarkup.markup;
                            } else {
                                markup =
                                    (b2cMarkup.markup * sharedTransferPrice) /
                                    100;
                            }
                            sharedTransferPrice += markup;
                        }

                        sharedTransferTotalPrice +=
                            sharedTransferPrice * totalPax;
                        sharedTransferTotalCost +=
                            activity?.sharedTransferCost * totalPax;
                    } else if (
                        selectedActivities[i]?.transferType === "private"
                    ) {
                        if (
                            activity.isPrivateTransferAvailable === false ||
                            !activity.privateTransfers ||
                            activity.privateTransfers?.length < 1
                        ) {
                            return sendErrorResponse(
                                res,
                                400,
                                "this activity doesn't have a private transfer option"
                            );
                        }

                        const sortedPvtTransfers =
                            activity.privateTransfers.sort(
                                (a, b) => a.maxCapacity - b.maxCapacity
                            );

                        let tempPax = totalPax;
                        while (tempPax > 0) {
                            for (
                                let j = 0;
                                j < sortedPvtTransfers.length;
                                j++
                            ) {
                                if (
                                    tempPax <=
                                        sortedPvtTransfers[j].maxCapacity ||
                                    j === sortedPvtTransfers.length - 1
                                ) {
                                    let currentPax =
                                        tempPax >
                                        sortedPvtTransfers[j].maxCapacity
                                            ? sortedPvtTransfers[j].maxCapacity
                                            : tempPax;
                                    let pvtTransferPrice =
                                        sortedPvtTransfers[j].price;
                                    let pvtTransferCost =
                                        sortedPvtTransfers[j].cost;

                                    if (b2cMarkup) {
                                        let markup = 0;
                                        if (b2cMarkup.markupType === "flat") {
                                            markup = b2cMarkup.markup;
                                        } else {
                                            markup =
                                                (b2cMarkup.markup *
                                                    pvtTransferPrice) /
                                                100;
                                        }
                                        pvtTransferPrice += markup;
                                    }

                                    privateTransfersTotalPrice +=
                                        pvtTransferPrice;
                                    privateTransfersTotalCost +=
                                        pvtTransferCost;
                                    tempPax -= currentPax;

                                    const objIndex = privateTransfers.findIndex(
                                        (obj) => {
                                            return (
                                                obj?.pvtTransferId ===
                                                sortedPvtTransfers[j]?._id
                                            );
                                        }
                                    );

                                    if (objIndex === -1) {
                                        privateTransfers.push({
                                            pvtTransferId:
                                                sortedPvtTransfers[j]?._id,
                                            name: sortedPvtTransfers[j].name,
                                            maxCapacity:
                                                sortedPvtTransfers[j]
                                                    .maxCapacity,
                                            count: 1,
                                            price: pvtTransferPrice,
                                            cost: sortedPvtTransfers[j].cost,
                                            totalPrice: pvtTransferPrice,
                                        });
                                    } else {
                                        privateTransfers[objIndex].count += 1;
                                        privateTransfers[objIndex].totalPrice +=
                                            pvtTransferPrice;
                                    }

                                    if (tempPax <= 0) {
                                        break;
                                    }
                                }
                            }
                        }
                    } else {
                        return sendErrorResponse(
                            res,
                            400,
                            "please select a valid transfer option."
                        );
                    }
                } else if (activity?.activityType === "normal") {
                    if (attraction.bookingType === "ticket") {
                        let adultTicketError = false;
                        let childTicketError = false;

                        let commonTickets = await AttractionTicket.find({
                            activity: activity._id,
                            status: "ok",
                            ticketFor: "common",
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
                            if (
                                commonTickets - adultTickets <
                                Number(selectedActivities[i]?.adultsCount)
                            ) {
                                adultTicketError = true;
                            } else {
                                commonTickets -=
                                    Number(selectedActivities[i]?.adultsCount) -
                                    adultTickets;
                            }
                        }

                        if (
                            childrenTickets <
                            Number(selectedActivities[i]?.childrenCount)
                        ) {
                            if (
                                commonTickets - childrenTickets <
                                Number(selectedActivities[i]?.childrenCount)
                            ) {
                                childTicketError = true;
                            } else {
                                commonTickets -=
                                    Number(
                                        selectedActivities[i]?.childrenCount
                                    ) - childrenTickets;
                            }
                        }

                        if (adultTicketError || childTicketError) {
                            return sendErrorResponse(
                                res,
                                500,
                                `${adultTicketError ? "adult tickets" : ""}${
                                    adultTicketError && childTicketError
                                        ? " and "
                                        : ""
                                }${
                                    childTicketError ? "child tickets" : ""
                                } sold out`
                            );
                        }
                    }

                    if (Number(selectedActivities[i]?.adultsCount) > 0) {
                        if (!adultActivityPrice) {
                            return sendErrorResponse(
                                res,
                                500,
                                "sorry, something went wrong with our end. please try again later"
                            );
                        }

                        if (b2cMarkup) {
                            let markup = 0;
                            if (b2cMarkup.markupType === "flat") {
                                markup = b2cMarkup.markup;
                            } else {
                                markup =
                                    (b2cMarkup.markup * adultActivityPrice) /
                                    100;
                            }
                            adultActivityPrice += markup;
                        }

                        adultActivityTotalPrice +=
                            adultActivityPrice *
                            Number(selectedActivities[i]?.adultsCount);
                        if (attraction.bookingType === "booking") {
                            adultActivityTotalCost +=
                                activity.adultCost *
                                    Number(
                                        selectedActivities[i]?.adultsCount
                                    ) || 0;
                        }
                    }

                    if (Number(selectedActivities[i]?.childrenCount) > 0) {
                        if (!childActivityPrice) {
                            return sendErrorResponse(
                                res,
                                400,
                                "sorry, something went wrong with our end. please try again later"
                            );
                        }
                        if (b2cMarkup) {
                            let markup = 0;
                            if (b2cMarkup.markupType === "flat") {
                                markup = b2cMarkup.markup;
                            } else {
                                markup =
                                    (b2cMarkup.markup * childActivityPrice) /
                                    100;
                            }
                            childActivityPrice += markup;
                        }

                        childActivityTotalPrice +=
                            childActivityPrice *
                            Number(selectedActivities[i]?.childrenCount);
                        if (attraction.bookingType === "booking") {
                            childActivityTotalCost +=
                                activity.childCost *
                                    Number(
                                        selectedActivities[i]?.childrenCount
                                    ) || 0;
                        }
                    }

                    if (
                        Number(selectedActivities[i]?.infantCount) > 0 &&
                        infantActivityPrice > 0
                    ) {
                        if (b2cMarkup) {
                            let markup = 0;
                            if (b2cMarkup.markupType === "flat") {
                                markup = b2cMarkup.markup;
                            } else {
                                markup =
                                    (b2cMarkup.markup * infantActivityPrice) /
                                    100;
                            }
                            infantActivityPrice += markup;
                        }

                        infantActivityTotalPrice +=
                            infantActivityPrice *
                            Number(selectedActivities[i]?.infantCount);
                        if (attraction.bookingType === "booking") {
                            infantActivityTotalCost +=
                                activity.infantCost *
                                    Number(
                                        selectedActivities[i]?.infantCount
                                    ) || 0;
                        }
                    }

                    if (selectedActivities[i]?.transferType === "shared") {
                        if (
                            activity.isSharedTransferAvailable === false ||
                            !sharedTransferPrice ||
                            !activity.sharedTransferCost
                        ) {
                            return sendErrorResponse(
                                res,
                                400,
                                "this activity doesn't have a shared transfer option"
                            );
                        }

                        sharedTransferTotalPrice +=
                            sharedTransferPrice * totalPax;
                        sharedTransferTotalCost +=
                            activity?.sharedTransferCost * totalPax;
                    } else if (
                        selectedActivities[i]?.transferType === "private"
                    ) {
                        if (
                            activity.isPrivateTransferAvailable === false ||
                            !activity.privateTransfers ||
                            activity.privateTransfers?.length < 1
                        ) {
                            return sendErrorResponse(
                                res,
                                400,
                                "this activity doesn't have a private transfer option"
                            );
                        }

                        const sortedPvtTransfers =
                            activity.privateTransfers.sort(
                                (a, b) => a.maxCapacity - b.maxCapacity
                            );

                        let tempPax = totalPax;
                        while (tempPax > 0) {
                            for (
                                let j = 0;
                                j < sortedPvtTransfers.length;
                                j++
                            ) {
                                if (
                                    tempPax <=
                                        sortedPvtTransfers[j].maxCapacity ||
                                    j === sortedPvtTransfers.length - 1
                                ) {
                                    let currentPax =
                                        tempPax >
                                        sortedPvtTransfers[j].maxCapacity
                                            ? sortedPvtTransfers[j].maxCapacity
                                            : tempPax;
                                    let pvtTransferPrice =
                                        sortedPvtTransfers[j].price;
                                    let pvtTransferCost =
                                        sortedPvtTransfers[j].cost;

                                    privateTransfersTotalPrice +=
                                        pvtTransferPrice;
                                    privateTransfersTotalCost +=
                                        pvtTransferCost;
                                    tempPax -= currentPax;

                                    const objIndex = privateTransfers.findIndex(
                                        (obj) => {
                                            return (
                                                obj?.pvtTransferId ===
                                                sortedPvtTransfers[j]?._id
                                            );
                                        }
                                    );

                                    if (objIndex === -1) {
                                        privateTransfers.push({
                                            pvtTransferId:
                                                sortedPvtTransfers[j]?._id,
                                            name: sortedPvtTransfers[j].name,
                                            maxCapacity:
                                                sortedPvtTransfers[j]
                                                    .maxCapacity,
                                            count: 1,
                                            price: pvtTransferPrice,
                                            cost: sortedPvtTransfers[j].cost,
                                            totalPrice: pvtTransferPrice,
                                        });
                                    } else {
                                        privateTransfers[objIndex].count += 1;
                                        privateTransfers[objIndex].totalPrice +=
                                            pvtTransferPrice;
                                    }

                                    if (tempPax <= 0) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    return sendErrorResponse(
                        res,
                        500,
                        "invalid activity type, please try again"
                    );
                }

                // Calculating OFFER
                if (activity?.activityType === "transfer") {
                    let totalWithoutOffer =
                        sharedTransferTotalPrice + privateTransfersTotalPrice;
                    if (attraction?.isOffer) {
                        if (attraction.offerAmountType === "flat") {
                            offerAmount = attraction.offerAmount;
                        } else {
                            offerAmount =
                                (totalWithoutOffer / 100) *
                                attraction.offerAmount;
                        }
                    }
                    grandTotal = totalWithoutOffer - offerAmount;
                } else {
                    let totalWithoutOffer =
                        adultActivityTotalPrice +
                        childActivityTotalPrice +
                        infantActivityTotalPrice;
                    if (attraction?.isOffer) {
                        if (attraction.offerAmountType === "flat") {
                            offerAmount = attraction.offerAmount;
                        } else {
                            offerAmount =
                                (totalWithoutOffer / 100) *
                                attraction.offerAmount;
                        }
                    }
                    totalWithoutOffer +=
                        sharedTransferTotalPrice + privateTransfersTotalPrice;
                    grandTotal = totalWithoutOffer - offerAmount;
                }

                selectedActivities[i].activityType = activity.activityType;
                // ACTIVITY PRICE
                if (activity.activityType === "normal") {
                    selectedActivities[i].adultActivityPrice =
                        adultActivityPrice || 0;
                    selectedActivities[i].childActivityPrice =
                        childActivityPrice || 0;
                    selectedActivities[i].infantActivityPrice =
                        infantActivityPrice || 0;
                    selectedActivities[i].adultActivityTotalPrice =
                        adultActivityTotalPrice;
                    selectedActivities[i].childActivityTotalPrice =
                        childActivityTotalPrice;
                    selectedActivities[i].infantActivityTotalPrice =
                        infantActivityTotalPrice;
                    // ACTIVITY COST
                    selectedActivities[i].adultActivityCost =
                        activity.adultCost || 0;
                    selectedActivities[i].childActivityCost =
                        activity.childCost || 0;
                    selectedActivities[i].infantActivityCost =
                        activity.infantCost || 0;
                    selectedActivities[i].adultActivityTotalCost =
                        adultActivityTotalCost;
                    selectedActivities[i].childActivityTotalCost =
                        childActivityTotalCost;
                    selectedActivities[i].infantActivityTotalCost =
                        infantActivityTotalCost;

                    selectedActivities[i].activityTotalPrice =
                        adultActivityTotalPrice +
                        childActivityTotalPrice +
                        infantActivityTotalPrice;
                    selectedActivities[i].activityTotalCost =
                        adultActivityTotalCost +
                        childActivityTotalCost +
                        infantActivityTotalCost;
                }

                if (selectedActivities[i].transferType === "shared") {
                    selectedActivities[i].sharedTransferPrice =
                        sharedTransferPrice;
                    selectedActivities[i].sharedTransferTotalPrice =
                        sharedTransferTotalPrice;
                    selectedActivities[i].sharedTransferCost =
                        activity.sharedTransferCost;
                    selectedActivities[i].sharedTransferTotalCost =
                        sharedTransferTotalCost;
                }

                if (selectedActivities[i].transferType === "private") {
                    selectedActivities[i].privateTransfers = privateTransfers;
                    selectedActivities[i].privateTransfersTotalPrice =
                        privateTransfersTotalPrice;
                    selectedActivities[i].privateTransfersTotalCost =
                        privateTransfersTotalCost;
                }

                let vatPercentage = 0;
                let totalVat = 0;
                if (activity.isVat) {
                    vatPercentage = activity.vat || 0;
                    if (activity.activityType === "transfer") {
                        totalVat =
                            ((sharedTransferTotalPrice +
                                privateTransfersTotalPrice) /
                                100) *
                            vatPercentage;
                    } else {
                        totalVat =
                            ((selectedActivities[i].activityTotalPrice || 0) /
                                100) *
                            vatPercentage;
                    }
                }

                selectedActivities[i].isvat = activity.isVat;
                selectedActivities[i].vatPercentage = vatPercentage;
                selectedActivities[i].totalVat = totalVat;

                selectedActivities[i].grandTotal = grandTotal;
                selectedActivities[i].totalWithoutOffer = totalWithoutOffer;
                selectedActivities[i].offerAmount = offerAmount;
                selectedActivities[i].totalCost =
                    (selectedActivities[i].activityTotalCost || 0) +
                    sharedTransferTotalCost +
                    privateTransfersTotalCost;
                selectedActivities[i].profit = 0;
                selectedActivities[i].status = "pending";
                selectedActivities[i].bookingType = attraction.bookingType;
                selectedActivities[i].attraction = attraction?._id;

                totalAmount += selectedActivities[i].grandTotal;
                totalOfferAmount += offerAmount;
            }

            let user;
            if (!req.user) {
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

            let buyer = req.user || user;

            const newAttractionOrder = new AttractionOrder({
                activities: selectedActivities,
                totalAmount,
                totalOfferAmount,
                user: buyer?._id,
                country,
                name,
                email,
                phoneNumber,
                orderStatus: "pending",
                referenceNumber: generateUniqueString("B2CATO"),
            });
            await newAttractionOrder.save();

            const newTransaction = new B2CTransaction({
                user: buyer?._id,
                amount: totalAmount,
                status: "pending",
                transactionType: "deduct",
                paymentProcessor,
                orderId: newAttractionOrder?._id,
            });
            await newTransaction.save();

            if (paymentProcessor === "paypal") {
                const currency = "USD";
                const totalAmountUSD = await convertCurrency(
                    totalAmount,
                    currency
                );
                const response = await createOrder(totalAmountUSD, currency);

                if (response.statusCode !== 201) {
                    return sendErrorResponse(
                        res,
                        400,
                        "Something went wrong while fetching order! Please try again later"
                    );
                }

                return res.status(200).json({
                    order: response.result,
                    orderId: newAttractionOrder?._id,
                });
            } else if (paymentProcessor === "razorpay") {
                const currency = "INR";
                const totalAmountINR = await convertCurrency(
                    totalAmount,
                    currency
                );
                const options = {
                    amount: totalAmountINR * 100,
                    currency,
                };
                const order = await instance.orders.create(options);
                return res
                    .status(200)
                    .json({ order, orderId: newAttractionOrder?._id });
            } else if (paymentProcessor === "ccavenue") {
                const orderParams = {
                    merchant_id: process.env.CCAVENUE_MERCHANT_ID,
                    order_id: newAttractionOrder?._id,
                    currency: "AED",
                    amount: totalAmount,
                    redirect_url: `${process.env.SERVER_URL}/api/v1/attractions/orders/ccavenue/capture`,
                    cancel_url: `${process.env.SERVER_URL}/api/v1/attractions/orders/ccavenue/capture`,
                    language: "EN",
                };
                let accessCode = process.env.CCAVENUE_ACCESS_CODE;

                const encRequest = ccav.getEncryptedOrder(orderParams);
                const formbody =
                    '<form id="nonseamless" method="post" name="redirect" action="https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction"/> <input type="hidden" id="encRequest" name="encRequest" value="' +
                    encRequest +
                    '"><input type="hidden" name="access_code" id="access_code" value="' +
                    accessCode +
                    '"><script language="javascript">document.redirect.submit();</script></form>';

                res.setHeader("Content-Type", "text/html");
                res.write(formbody);
                res.end();
                return;
            } else {
                return sendErrorResponse(res, 400, "Invalid payment processor");
            }
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    capturePaypalAttractionPayment: async (req, res) => {
        try {
            const { paymentId, paymentOrderId, orderId } = req.body;

            // const { _, error } = attractionOrderCaptureSchema.validate(
            //     req.body
            // );
            // if (error) {
            //     return sendErrorResponse(res, 400, error.details[0].message);
            // }

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "invalid order id");
            }

            const attractionOrder = await AttractionOrder.findOne({
                _id: orderId,
            });
            if (!attractionOrder) {
                return sendErrorResponse(
                    res,
                    400,
                    "Attraction order not found!. Please create an order first. Check with our team if amount is debited from your bank!"
                );
            }

            if (attractionOrder.orderStatus === "completed") {
                return sendErrorResponse(
                    res,
                    400,
                    "This order already completed, Thank you. Check with our team if you paid multiple times."
                );
            }

            let transaction = await B2CTransaction.findOne({
                paymentProcessor: "paypal",
                orderId: attractionOrder?._id,
                status: "pending",
            });
            if (!transaction) {
                const transaction = new B2CTransaction({
                    user: attractionOrder.user,
                    amount: attractionOrder?.totalAmount,
                    status: "pending",
                    transactionType: "deduct",
                    paymentProcessor: "paypal",
                    orderId: attractionOrder?._id,
                });
                await transaction.save();
            }

            const orderObject = await fetchOrder(paymentOrderId);

            if (orderObject.statusCode === "500") {
                transaction.status = "failed";
                await transaction.save();

                return sendErrorResponse(
                    res,
                    400,
                    "Error while fetching order status from paypal. Check with our team if amount is debited from your bank!"
                );
            } else if (orderObject.status !== "COMPLETED") {
                transaction.status = "failed";
                await transaction.save();

                return sendErrorResponse(
                    res,
                    400,
                    "Paypal order status is not Completed. Check with our team if amount is debited from your bank!"
                );
            } else {
                const paymentObject = await fetchPayment(paymentId);

                if (paymentObject.statusCode == "500") {
                    transaction.status = "failed";
                    await transaction.save();

                    return sendErrorResponse(
                        res,
                        400,
                        "Error while fetching payment status from paypal. Check with our team if amount is debited from your bank!"
                    );
                } else if (paymentObject.result.status !== "COMPLETED") {
                    transaction.status = "failed";
                    await transaction.save();

                    return sendErrorResponse(
                        res,
                        400,
                        "Paypal payment status is not Completed. Please complete your payment!"
                    );
                }
            }

            transaction.status = "success";
            await transaction.save();
            attractionOrder.isPaid = true;
            await attractionOrder.save();

            await completeOrderAfterPayment(attractionOrder);

            attractionOrder.orderStatus = "completed";
            await attractionOrder.save();

            return res.status(200).json({
                message: "Transaction Successful",
            });
        } catch (error) {
            console.log(error);
            return sendErrorResponse(
                res,
                400,
                "Payment processing failed! If money is deducted contact team, else try again!"
            );
        }
    },

    captureCCAvenueAttractionPayment: async (req, res) => {
        try {
            const { encResp } = req.body;

            const decryptedJsonResponse = ccav.redirectResponseToJson(encResp);
            const { order_id, order_status } = decryptedJsonResponse;

            const attractionOrder = await AttractionOrder.findOne({
                _id: order_id,
            });
            if (!attractionOrder) {
                return sendErrorResponse(
                    res,
                    400,
                    "Attraction order not found!. Please create an order first. Check with our team if amount is debited from your bank!"
                );
            }

            if (attractionOrder.orderStatus === "completed") {
                return sendErrorResponse(
                    res,
                    400,
                    "This order already completed, Thank you. Check with our team if you paid multiple times."
                );
            }

            let transaction = await B2CTransaction.findOne({
                paymentProcessor: "ccavenue",
                orderId: attractionOrder?._id,
                status: "pending",
            });
            if (!transaction) {
                const transaction = new B2CTransaction({
                    user: attractionOrder.user,
                    amount: attractionOrder?.totalAmount,
                    status: "pending",
                    transactionType: "deduct",
                    paymentProcessor: "ccavenue",
                    orderId: attractionOrder?._id,
                });
                await transaction.save();
            }

            if (order_status !== "Success") {
                transaction.status = "failed";
                await transaction.save();

                res.writeHead(301, {
                    Location: `https://mytravellerschoice.com/attractions/orders/${order_id}/cancelled`,
                });
                res.end();
            } else {
                transaction.status = "success";
                await transaction.save();
                attractionOrder.isPaid = true;
                await attractionOrder.save();

                await completeOrderAfterPayment(attractionOrder);

                attractionOrder.orderStatus = "completed";
                await attractionOrder.save();

                res.writeHead(301, {
                    Location: `https://mytravellerschoice.com/print${order_id}`,
                });
                res.end();
            }
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    captureRazorpayAttractionPayment: async (req, res) => {
        try {
            const {
                razorpay_order_id,
                transactionid,
                razorpay_signature,
                orderId,
            } = req.body;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "invalid order id");
            }

            const attractionOrder = await AttractionOrder.findOne({
                _id: orderId,
            });
            if (!attractionOrder) {
                return sendErrorResponse(
                    res,
                    400,
                    "Attraction order not found!. Please create an order first. Check with our team if amount is debited from your bank!"
                );
            }

            if (attractionOrder.orderStatus === "completed") {
                return sendErrorResponse(
                    res,
                    400,
                    "This order already completed, Thank you. Check with our team if you paid multiple times."
                );
            }

            let transaction = await B2CTransaction.findOne({
                paymentProcessor: "razorpay",
                orderId: attractionOrder?._id,
                status: "pending",
            });
            if (!transaction) {
                const newTransaction = new B2CTransaction({
                    user: attractionOrder.user,
                    amount: attractionOrder?.totalAmount,
                    status: "pending",
                    transactionType: "deduct",
                    paymentProcessor: "razorpay",
                    orderId: attractionOrder?._id,
                });
                await newTransaction.save();
            }

            const generated_signature = crypto.createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            );
            generated_signature.update(razorpay_order_id + "|" + transactionid);

            if (generated_signature.digest("hex") !== razorpay_signature) {
                transaction.status = "failed";
                await transaction.save();
                attractionOrder.orderStatus = "failed";
                await attractionOrder.save();

                return sendErrorResponse(res, 400, "Transaction failed");
            }

            transaction.status = "success";
            await transaction.save();
            attractionOrder.isPaid = true;
            await attractionOrder.save();

            await completeOrderAfterPayment(attractionOrder);

            attractionOrder.orderStatus = "completed";
            await attractionOrder.save();

            return res.status(200).json({
                message: "Transaction Successful",
            });
        } catch (err) {
            sendErrorResponse(res, 400, err);
        }
    },

    getSingleAttractionOrder: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attractionOrder = await AttractionOrder.findById(id)
                .populate("activities.activity")
                .populate(
                    "activities.attraction",
                    "title isOffer offerAmount offerAmountType logo images"
                )
                .populate("country")
                .lean();

            if (!attractionOrder) {
                return sendErrorResponse(res, 400, "Attraction not found");
            }

            res.status(200).json(attractionOrder);
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
            const order = await AttractionOrder.findOne(
                {
                    _id: orderId,
                    user: req.user?._id,
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
                    ticketNo: order.activities[0].adultTickets,
                }).updateMany({ status: "ok" });
                await AttractionTicket.find({
                    activity: order.activities[0].activity,
                    ticketNo: order.activities[0].childTickets,
                }).updateMany({ status: "ok" });
                await AttractionTicket.find({
                    activity: order.activities[0].activity,
                    ticketNo: order.activities[0].infantTickets,
                }).updateMany({ status: "ok" });
            }

            // Refund the order amount after substracting fee

            await AttractionOrder.findOneAndUpdate(
                {
                    _id: orderId,
                    "activities._id": orderItemId,
                    user: req.user?._id,
                },
                {
                    "activities.$.status": "cancelled",
                    "activities.$.cancelledBy": "user",
                    "activities.$.cancellationFee": cancellationFee,
                    "activities.$.refundAmount": orderAmount - cancellationFee,
                    "activities.$.isRefundAvailable": true,
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

    refundRequest: async (req, res) => {
        try {
            const { orderId, orderItemId } = req.params;

            const {
                isoCode,
                bankName,
                accountHolderName,
                accountNumber,
                ifscCode,
                ibanCode,
            } = req.body;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "invalid order id");
            }

            if (!isValidObjectId(orderItemId)) {
                return sendErrorResponse(res, 400, "invalid orderItemId id");
            }

            let country = await Country.findOne({ isocode: isoCode });

            if (!country) {
                return sendErrorResponse(res, 400, "Country Not Found");
            }

            if (isoCode === "IN" && ifscCode == "") {
                return sendErrorResponse(res, 400, "IFSC Code is required");
            }

            const attractionOrder = await AttractionOrder.findOne({
                _id: orderId,
                user: req.user?._id,
                activities: {
                    $elemMatch: {
                        _id: orderItemId,
                        isRefundAvailable: true,
                    },
                },
            });

            console.log(attractionOrder, "attractionOrders");

            if (!attractionOrder) {
                return sendErrorResponse(
                    res,
                    400,
                    "attraction order not found"
                );
            }

            let bankDetails = new B2CBankDetails({
                bankName,
                bankCountry: country.isocode,
                countryId: country._id,
                accountHolderName,
                accountNumber,
                ifscCode,
                ibanCode,
            });

            await bankDetails.save();

            console.log(bankDetails, "bankDetails");

            const refund = new Refund({
                category: "attraction",
                orderId: attractionOrder._id,
                actitvityId: attractionOrder.activities[0]._id,
                userId: req.user._id,
                amount: attractionOrder.activities[0].refundAmount,
                bankDetails: bankDetails._id,
                status: "pending",
            });

            await refund.save();

            console.log(refund, "refund");
            res.status(200).json({
                message: "Refund Request Has Been Send Suceessfully",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleUserAllOrders: async (req, res) => {
        try {
            const { result, skip, limit } = await getUserOrder({
                ...req.query,
                userId: req.user?._id,
            });

            res.status(200).json({ result, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
