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
    AttractionOrder,
    HomeSettings,
} = require("../../models");
const {
    B2BClientAttractionMarkup,
    B2BSubAgentAttractionMarkup,
    B2BAttractionOrder,
    B2BWallet,
    B2BTransaction,
    B2BSpecialAttractionMarkup,
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
            let specialB2bMarkup;
            if (req.reseller.role === "reseller") {
                specialB2bMarkup = await B2BSpecialAttractionMarkup.findOne({
                    resellerId: req.reseller?._id,
                });
            } else {
                specialB2bMarkup = await B2BSpecialAttractionMarkup.findOne({
                    resellerId: req.reseller?.referredBy,
                });
            }

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
                let markups = [];
                let totalResellerMarkup = 0;
                let totalSubAgentMarkup = 0;
                let resellerToSubAgentMarkup;
                let resellerToClientMarkup;
                let totalPax =
                    (Number(selectedActivities[i]?.adultsCount) || 0) +
                    (Number(selectedActivities[i]?.childrenCount) || 0);

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

                        if (specialB2bMarkup) {
                            let markup = 0;
                            if (specialB2bMarkup.markupType === "flat") {
                                markup = specialB2bMarkup.markup;
                            } else {
                                markup =
                                    (specialB2bMarkup.markup *
                                        sharedTransferPrice) /
                                    100;
                            }
                            sharedTransferPrice += markup;
                        }
                        if (resellerToSubAgentMarkup) {
                            let markup = 0;
                            if (
                                resellerToSubAgentMarkup.markupType === "flat"
                            ) {
                                markup = resellerToSubAgentMarkup.markup;
                            } else {
                                markup =
                                    (resellerToSubAgentMarkup.markup *
                                        sharedTransferPrice) /
                                    100;
                            }
                            totalResellerMarkup += markup * totalPax;
                            sharedTransferPrice += markup;
                        }

                        if (resellerToClientMarkup) {
                            let markup = 0;
                            if (resellerToClientMarkup.markupType === "flat") {
                                markup = resellerToClientMarkup.markup;
                            } else {
                                markup =
                                    (resellerToClientMarkup.markup *
                                        sharedTransferPrice) /
                                    100;
                            }
                            totalSubAgentMarkup += markup * totalPax;
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

                                    if (specialB2bMarkup) {
                                        let markup = 0;
                                        if (
                                            specialB2bMarkup.markupType ===
                                            "flat"
                                        ) {
                                            markup = specialB2bMarkup.markup;
                                        } else {
                                            markup =
                                                (specialB2bMarkup.markup *
                                                    pvtTransferPrice) /
                                                100;
                                        }
                                        pvtTransferPrice += markup;
                                    }
                                    if (resellerToSubAgentMarkup) {
                                        let markup = 0;
                                        if (
                                            resellerToSubAgentMarkup.markupType ===
                                            "flat"
                                        ) {
                                            markup =
                                                resellerToSubAgentMarkup.markup;
                                        } else {
                                            markup =
                                                (resellerToSubAgentMarkup.markup *
                                                    pvtTransferPrice) /
                                                100;
                                        }
                                        totalResellerMarkup +=
                                            markup * currentPax;
                                        pvtTransferPrice += markup;
                                    }

                                    if (resellerToClientMarkup) {
                                        let markup = 0;
                                        if (
                                            resellerToClientMarkup.markupType ===
                                            "flat"
                                        ) {
                                            markup =
                                                resellerToClientMarkup.markup;
                                        } else {
                                            markup =
                                                (resellerToClientMarkup.markup *
                                                    pvtTransferPrice) /
                                                100;
                                        }
                                        totalSubAgentMarkup +=
                                            markup * currentPax;
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
                        if (specialB2bMarkup) {
                            let markup = 0;
                            if (specialB2bMarkup.markupType === "flat") {
                                markup = specialB2bMarkup.markup;
                            } else {
                                markup =
                                    (specialB2bMarkup.markup *
                                        adultActivityPrice) /
                                    100;
                            }
                            adultActivityPrice += markup;
                        }
                        if (resellerToSubAgentMarkup) {
                            let markup = 0;
                            if (
                                resellerToSubAgentMarkup.markupType === "flat"
                            ) {
                                markup = resellerToSubAgentMarkup.markup;
                            } else {
                                markup =
                                    (resellerToSubAgentMarkup.markup *
                                        activity.adultActivityPrice) /
                                    100;
                            }

                            totalResellerMarkup +=
                                markup *
                                Number(selectedActivities[i]?.adultsCount);
                            adultActivityPrice += markup;
                        }

                        if (resellerToClientMarkup) {
                            let markup = 0;
                            if (resellerToClientMarkup.markupType === "flat") {
                                markup = resellerToClientMarkup.markup;
                            } else {
                                markup =
                                    (resellerToClientMarkup.markup *
                                        adultActivityPrice) /
                                    100;
                            }
                            totalSubAgentMarkup +=
                                markup *
                                Number(selectedActivities[i]?.adultsCount);
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
                        if (specialB2bMarkup) {
                            let markup = 0;
                            if (specialB2bMarkup.markupType === "flat") {
                                markup = specialB2bMarkup.markup;
                            } else {
                                markup =
                                    (specialB2bMarkup.markup *
                                        childActivityPrice) /
                                    100;
                            }
                            childActivityPrice += markup;
                        }
                        if (resellerToSubAgentMarkup) {
                            let markup = 0;
                            if (
                                resellerToSubAgentMarkup.markupType === "flat"
                            ) {
                                markup = resellerToSubAgentMarkup.markup;
                            } else {
                                markup =
                                    (resellerToSubAgentMarkup.markup *
                                        activity?.childActivityPrice) /
                                    100;
                            }
                            totalResellerMarkup +=
                                markup *
                                Number(selectedActivities[i]?.childrenCount);
                            childActivityPrice += markup;
                        }

                        if (resellerToClientMarkup) {
                            let markup = 0;
                            if (resellerToClientMarkup.markupType === "flat") {
                                markup = resellerToClientMarkup.markup;
                            } else {
                                markup =
                                    (resellerToClientMarkup.markup *
                                        childActivityPrice) /
                                    100;
                            }
                            totalSubAgentMarkup +=
                                markup *
                                Number(selectedActivities[i]?.childrenCount);
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
                        if (specialB2bMarkup) {
                            let markup = 0;
                            if (specialB2bMarkup.markupType === "flat") {
                                markup = specialB2bMarkup.markup;
                            } else {
                                markup =
                                    (specialB2bMarkup.markup *
                                        infantActivityPrice) /
                                    100;
                            }
                            infantActivityPrice += markup;
                        }
                        if (resellerToSubAgentMarkup) {
                            let markup = 0;
                            if (
                                resellerToSubAgentMarkup.markupType === "flat"
                            ) {
                                markup = resellerToSubAgentMarkup.markup;
                            } else {
                                markup =
                                    (resellerToSubAgentMarkup.markup *
                                        selectedActivities[i]
                                            ?.infantActivityPrice) /
                                    100;
                            }
                            totalResellerMarkup +=
                                markup *
                                Number(selectedActivities[i]?.infantCount);
                            infantActivityPrice += markup;
                        }

                        if (resellerToClientMarkup) {
                            let markup = 0;
                            if (resellerToClientMarkup.markupType === "flat") {
                                markup = resellerToClientMarkup.markup;
                            } else {
                                markup =
                                    (resellerToClientMarkup.markup *
                                        infantActivityPrice) /
                                    100;
                            }
                            totalSubAgentMarkup +=
                                markup *
                                Number(selectedActivities[i]?.infantCount);
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

                selectedActivities[i].grandTotal =
                    (selectedActivities[i].activityTotalPrice || 0) +
                    sharedTransferTotalPrice +
                    privateTransfersTotalPrice;
                selectedActivities[i].totalCost =
                    (selectedActivities[i].activityTotalCost || 0) +
                    sharedTransferTotalCost +
                    privateTransfersTotalCost;
                selectedActivities[i].profit = 0;
                selectedActivities[i].status = "pending";
                selectedActivities[i].bookingType = attraction.bookingType;
                selectedActivities[i].attraction = attraction?._id;

                selectedActivities[i].resellerMarkup = totalResellerMarkup;
                selectedActivities[i].subAgentMarkup = totalSubAgentMarkup;
                selectedActivities[i].totalMarkup =
                    totalResellerMarkup + totalSubAgentMarkup;
                selectedActivities[i].markups = markups;

                totalAmount += selectedActivities[i].grandTotal;
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
                let reseller = req.reseller;
                sendInsufficentBalanceMail(reseller);
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
                let totalPurchaseCost = attractionOrder.activities[i].totalCost;
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
                                $or: [
                                    { ticketFor: "adult" },
                                    { ticketFor: "common" },
                                ],
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
                                $or: [
                                    { ticketFor: "child" },
                                    { ticketFor: "common" },
                                ],
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
                                        $or: [
                                            { ticketFor: "infant" },
                                            { ticketFor: "common" },
                                        ],
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
                    attractionOrder.activities[i].status = "booked";
                }
                attractionOrder.activities[i].totalCost = totalPurchaseCost;
                attractionOrder.activities[i].profit =
                    attractionOrder.activities[i].grandTotal -
                    (attractionOrder.activities[i].totalCost +
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

            let reseller = req.reseller;
            const companyDetails = await HomeSettings.findOne();
            sendWalletDeductMail(reseller, attractionOrder , companyDetails);

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

            sendAttractionOrderEmail(req.reseller, attractionOrder);
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
                downloader: req.reseller?.role,
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
                    $lookup: {
                        from: "destinations",
                        localField: "activities.attraction.destination",
                        foreignField: "_id",
                        as: "activities.destination",
                    },
                },
                {
                    $set: {
                        "activities.destination": {
                            $arrayElemAt: ["$activities.destination", 0],
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
                                description: 1,
                            },
                            attraction: {
                                title: 1,
                                images: 1,
                                logo: 1,
                            },
                            destination: {
                                name: 1,
                            },
                        },
                        createdAt: 1,
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
                        createdAt: { $first: "$createdAt" },
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

    getAttractionOrderTickets: async (req, res) => {
        try {
            const { orderId, orderItemId } = req.params;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "invalid order id");
            }

            // const orderDetailss = await B2BAttractionOrder.findOne(
            //     {
            //         _id: orderId,
            //         orderStatus: "paid",
            //     },
            //     { activities: { $elemMatch: { _id: orderItemId } } }
            // ).populate({
            //     path: "activity",
            //     populate: {
            //         path: "attraction",
            //         populate: { path: "destination" },
            //         select: "title images logo",
            //     },
            //     select: "name description",
            // });

            const orderDetails = await B2BAttractionOrder.aggregate([
                {
                    $match: {
                        _id: Types.ObjectId(orderId),
                        orderStatus: "paid",
                        activities: {
                            $elemMatch: { _id: Types.ObjectId(orderItemId) },
                        },
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
                    },
                },
                {
                    $project: {
                        activities: {
                            activity: {
                                name: 1,
                                description: 1,
                            },
                            attraction: {
                                title: 1,
                                logo: 1,
                                images: 1,
                            },
                            adultTickets: 1,
                            childTickets: 1,
                            infantTickets: 1,
                        },
                    },
                },
            ]);

            if (!orderDetails || orderDetails?.activities?.length < 1) {
                return sendErrorResponse(res, 400, "order not found");
            }

            res.status(200).json(orderDetails[0]);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
