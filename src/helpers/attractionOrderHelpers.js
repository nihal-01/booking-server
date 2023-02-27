const { AttractionTicket } = require("../models");

module.exports = {
    completeOrderAfterPayment: async (attractionOrder) => {
        try {
            for (let i = 0; i < attractionOrder.activities?.length; i++) {
                const activity = await AttractionActivity.findOne({
                    _id: attractionOrder.activities[i].activity,
                });

                let totalPurchaseCost = attractionOrder.activities[i].totalCost;
                if (attractionOrder.activities[i].bookingType === "ticket") {
                    const adultTickets = await AttractionTicket.find({
                        activity: attractionOrder.activities[i].activity,
                        status: "ok",
                        $and: [
                            {
                                $or: [
                                    { ticketFor: "adult" },
                                    { ticketFor: "common" },
                                ],
                            },
                            {
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
                        ],
                    })
                        .limit(attractionOrder.activities[i].adultsCount)
                        .lean();

                    if (
                        adultTickets.length <
                        attractionOrder.activities[i].adultsCount
                    ) {
                        return sendErrorResponse(res, 400, "tickets sold out.");
                    }

                    const childTickets = await AttractionTicket.find({
                        activity: attractionOrder.activities[i].activity,
                        status: "ok",
                        $and: [
                            {
                                $or: [
                                    { ticketFor: "child" },
                                    { ticketFor: "common" },
                                ],
                            },
                            {
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
                        ],
                    })
                        .limit(attractionOrder.activities[i].childrenCount)
                        .lean();

                    if (
                        childTickets.length <
                        attractionOrder.activities[i].childrenCount
                    ) {
                        return sendErrorResponse(res, 400, "tickets sold out.");
                    }

                    let infantTickets = [];
                    if (
                        activity.infantPrice > 0 &&
                        attractionOrder.activities[i].infantCount > 0
                    ) {
                        infantTickets = await AttractionTicket.find({
                            activity: attractionOrder.activities[i].activity,
                            status: "ok",
                            $and: [
                                {
                                    $or: [
                                        { ticketFor: "infant" },
                                        { ticketFor: "common" },
                                    ],
                                },
                                {
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
                            ],
                        })
                            .limit(attractionOrder.activities[i].infantCount)
                            .lean();

                        if (
                            infantTickets.length <
                            attractionOrder.activities[i].infantCount
                        ) {
                            return sendErrorResponse(
                                res,
                                400,
                                "tickets sold out."
                            );
                        }

                        const infantTicketsIds = infantTickets.map((ticket) => {
                            totalPurchaseCost += ticket.ticketCost;
                            return ticket?._id;
                        });

                        await AttractionTicket.find({
                            _id: { $all: infantTicketsIds },
                        }).updateMany({ status: "used" });
                    }

                    const adultTicketsIds = adultTickets.map((ticket) => {
                        totalPurchaseCost += ticket.ticketCost;
                        return ticket?._id;
                    });

                    await AttractionTicket.find({
                        _id: { $all: adultTicketsIds },
                    }).updateMany({ status: "used" });

                    const childTicketsIds = childTickets.map((ticket) => {
                        totalPurchaseCost += ticket.ticketCost;
                        return ticket?._id;
                    });

                    await AttractionTicket.find({
                        _id: { $all: childTicketsIds },
                    }).updateMany({ status: "used" });

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
                    attractionOrder.activities[i].totalCost;
            }
        } catch (err) {
            throw err;
        }
    },
};
