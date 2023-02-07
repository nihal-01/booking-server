const { AttractionTicket } = require("../models");

module.exports = {
    completeOrderAfterPayment: async (attractionOrder) => {
        try {
            for (let i = 0; i < attractionOrder.activities?.length; i++) {
                let activity = attractionOrder.activities[i];

                if (activity.bookingType === "ticket") {
                    let adultTickets = [];
                    let childTickets = [];
                    let totalAdultPurchaseCost = 0;
                    let totalChildPurchaseCost = 0;

                    for (let i = 0; i < activity.adultsCount; i++) {
                        const ticket = await AttractionTicket.findOneAndUpdate(
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
                        const ticket = await AttractionTicket.findOneAndUpdate(
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

                    attractionOrder.activities[i].adultTickets = adultTickets;
                    attractionOrder.activities[i].childTickets = childTickets;
                    attractionOrder.activities[i].profit =
                        attractionOrder.activities[i].amount -
                        (totalAdultPurchaseCost + totalChildPurchaseCost);
                    attractionOrder.activities[i].status = "confirmed";
                } else {
                    attractionOrder.activities[i].status = "booked";
                }
            }
        } catch (err) {
            throw err;
        }
    },
};
