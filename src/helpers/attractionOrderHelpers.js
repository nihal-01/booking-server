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
                    attractionOrder.activities[i].totalCost;
            }
        } catch (err) {
            throw err;
        }
    },
};
