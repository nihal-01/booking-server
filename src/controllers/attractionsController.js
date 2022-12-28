const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../helpers");
const {
    Attraction,
    AttractionActivity,
    AttractionOrder,
    AttractionTicket,
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

            const newAttractionOrder = new AttractionOrder({
                attraction,
                orders: selectedActivities,
                totalAmount,
                user: req.user?._id || undefined,
                status: "pending",
            });
            await newAttractionOrder.save();

            res.status(200).json(newAttractionOrder);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    // createPaymentOrder: async (req, res) => {
    //     try {
    //         const { attractionOrderId } = req.body;

    //         if (!isValidObjectId(attractionOrderId)) {
    //             return sendErrorResponse(res, 400, "Invalid order id");
    //         }

    //         const attractionOrder = await AttractionOrder.findById(
    //             attractionOrderId
    //         );
    //         if (!attractionOrder) {
    //             return sendErrorResponse(res, 404, "Order not found");
    //         }

    //         for (let i = 0; i < attractionOrder.orders?.length; i++) {
    //             let order = attractionOrder.orders[i];

    //             const adultTickets = await AttractionTicket.find({
    //                 activity: order.activity,
    //                 status: "ok",
    //                 ticketFor: "adult",
    //                 $or: [
    //                     {
    //                         validity: true,
    //                         validTill: {
    //                             $gte: new Date(order.date).toISOString(),
    //                         },
    //                     },
    //                     { validity: false },
    //                 ],
    //             }).count();
    //             const childrenTickets = await AttractionTicket.find({
    //                 activity: order.activity,
    //                 status: "ok",
    //                 ticketFor: "child",
    //                 $or: [
    //                     {
    //                         validity: true,
    //                         validTill: {
    //                             $gte: new Date(order.date).toISOString(),
    //                         },
    //                     },
    //                     { validity: false },
    //                 ],
    //             }).count();

    //             if (order?.adultsCount > adultTickets) {
    //                 return sendErrorResponse(
    //                     res,
    //                     400,
    //                     "Sorry, Adult Tickets sold out"
    //                 );
    //             }
    //             if (order?.childrenCount > childrenTickets) {
    //                 return sendErrorResponse(
    //                     res,
    //                     400,
    //                     "Sorry, Adult Tickets sold out"
    //                 );
    //             }

    //             if (order.adultsCount) {
    //                 await AttractionTicket.find({
    //                     activity: order.activity,
    //                     status: "ok",
    //                     ticketFor: "adult",
    //                     $or: [
    //                         {
    //                             validity: true,
    //                             validTill: {
    //                                 $gte: new Date(order.date).toISOString(),
    //                             },
    //                         },
    //                         { validity: false },
    //                     ],
    //                 })
    //                     .limit(3)
    //                     .updateMany({
    //                         status: "used",
    //                     });
    //             }
    //         }

    //         const PaypalClient = client();
    //         const request = new paypal.orders.OrdersCreateRequest();

    //         request.headers["prefer"] = "return=representation";
    //         request.requestBody({
    //             intent: "CAPTURE",
    //             purchase_units: [
    //                 {
    //                     amount: {
    //                         currency_code: "AED",
    //                         value: 7,
    //                     },
    //                 },
    //             ],
    //         });
    //         const response = await PaypalClient.execute(request);
    //         if (response.statusCode !== 201) {
    //             res.status(500);
    //         }

    //         //Once order is created store the data using Prisma
    //         await prisma.payment.create({
    //             data: {
    //                 orderID: response.result.id,
    //                 status: "PENDING",
    //             },
    //         });
    //         res.json({ orderID: response.result.id });
    //     } catch (err) {
    //         sendErrorResponse(res, 500, err);
    //     }
    // },

    capturePayment: async (req, res) => {
        try {
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
