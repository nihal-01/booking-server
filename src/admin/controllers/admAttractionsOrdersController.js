const { sendErrorResponse } = require("../../helpers");
const { AttractionOrder } = require("../../models");

module.exports = {
    getAllOrders: async (req, res) => {
        try {
            const { skip = 0, limit = 10, bookingType, status } = req.query;

            const filters = {
                "activities.status": {
                    $in: ["booked", "confirmed", "cancelled"],
                },
            };

            if (bookingType && bookingType != "") {
                filters["activities.bookingType"] = bookingType;
            }

            if (status && status !== "") {
                filters["activities.status"] = status;
            }

            const orders = await AttractionOrder.aggregate([
                {
                    $unwind: "$activities",
                },
                { $match: filters },
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
                        localField: "activities.activity.attraction",
                        foreignField: "_id",
                        as: "attraction",
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
                {
                    $set: {
                        "activities.activity": {
                            $arrayElemAt: ["$activities.activity", 0],
                        },
                        attraction: {
                            $arrayElemAt: ["$attraction", 0],
                        },
                        country: { $arrayElemAt: ["$country", 0] },
                    },
                },
                { $sort: { createdAt: -1 } },
                {
                    $project: {
                        totalOffer: 1,
                        totalAmount: 1,
                        name: 1,
                        email: 1,
                        phoneNumber: 1,
                        country: 1,
                        orderStatus: 1,
                        merchant: 1,
                        paymentStatus: 1,
                        paymentOrderId: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        attraction: {
                            title: 1,
                            images: 1,
                        },
                        activities: {
                            activity: {
                                name: 1,
                            },
                            bookingType: 1,
                            date: 1,
                            adultsCount: 1,
                            childrenCount: 1,
                            infantCount: 1,
                            adultCost: 1,
                            childCost: 1,
                            transferType: 1,
                            offerAmount: 1,
                            amount: 1,
                            adultTickets: 1,
                            childTickets: 1,
                            status: 1,
                            isRefunded: 1,
                            profit: 1,
                            _id: 1,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        data: { $push: "$$ROOT" },
                    },
                },
                {
                    $project: {
                        totalOrders: 1,
                        data: {
                            $slice: [
                                "$data",
                                Number(limit) * Number(skip),
                                Number(limit),
                            ],
                        },
                    },
                },
            ]);

            res.status(200).json({
                result: orders[0],
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    confirmBooking: async (req, res) => {
        try {
            const { order, bookingId, bookingConfirmationNumber } = req.body;

            const orderDetails = await AttractionOrder.findOne(
                {
                    _id: order,
                },
                { activities: { $elemMatch: { _id: bookingId } } }
            );

            if (!orderDetails || orderDetails?.activities?.length < 1) {
                return sendErrorResponse(res, 400, "Order not found");
            }

            if (orderDetails.activities[0]?.bookingType !== "booking") {
                return sendErrorResponse(
                    res,
                    400,
                    "Only bookings can confirmed!"
                );
            }

            if (orderDetails.activities[0].status !== "booked") {
                return sendErrorResponse(
                    res,
                    400,
                    "You can't confirm this booking. because this order not booked or cancelled or already confirmed"
                );
            }

            await AttractionOrder.findOneAndUpdate(
                {
                    _id: order,
                    "activities._id": bookingId,
                },
                {
                    "activities.$.status": "confirmed",
                    "activities.$.bookingConfirmationNumber":
                        bookingConfirmationNumber,
                },
                { runValidators: true }
            );

            res.status(200).json({
                message: "Booking confirmed successfully",
                bookingConfirmationNumber,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
