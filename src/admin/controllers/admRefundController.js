const { sendErrorResponse } = require("../../helpers");
const {
    paymentServiceSchema,
} = require("../validations/admPaymentService.schema");
const {
    PaymentService,
    Refund,
    B2CTransaction,
    AttractionOrder,
} = require("../../models");
const { isValidObjectId } = require("mongoose");
module.exports = {
    listRefundAll: async (req, res) => {
        try {
            const { skip = 0, limit = 10, status, category } = req.query;

            console.log(category, "hiiii");

            const filters = {};

            if (status && status !== "") {
                filters.status = status;
            }

            if (category && category !== "") {
                filters.category = category;
            }

            // if (orderedBy == "b2c") {
            const listRefund = await Refund.aggregate([
                { $match: filters },

                {
                    $lookup: {
                        from: "b2cbankdetails",
                        localField: "bankDetails",
                        foreignField: "_id",
                        as: "bankDetails",
                    },
                },
                {
                    $lookup: {
                        from: "attractionorders",
                        let: { orderId: "$orderId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$_id", "$$orderId"] },
                                },
                            },

                            {
                                $addFields: {
                                    activities: {
                                        $filter: {
                                            input: "$activities",
                                            as: "activity",
                                            cond: {
                                                $eq: [
                                                    "$$activity.activityId",
                                                    "$activityId",
                                                ],
                                            },
                                        },
                                    },
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
                                    "activities.attraction": {
                                        $arrayElemAt: [
                                            "$activities.attraction",
                                            0,
                                        ],
                                    },
                                },
                            },
                            {
                                $project: {
                                    referenceNumber: 1,
                                    activities: {
                                        attraction: {
                                            title: 1,
                                        },
                                    },
                                },
                            },
                        ],
                        as: "order",
                    },
                },

                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $set: {
                        user: {
                            $arrayElemAt: ["$user", 0],
                        },
                        bankDetails: {
                            $arrayElemAt: ["$bankDetails", 0],
                        },
                        order: {
                            $arrayElemAt: ["$order", 0],
                        },
                    },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        RequestDetails: { $push: "$$ROOT" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        count: 1,
                        data: {
                            $slice: [
                                "$RequestDetails",
                                Number(skip * limit),
                                Number(limit),
                            ],
                        },
                    },
                },
            ]);

            console.log(listRefund, "listRefund");

            res.status(200).json({
                listRefund: listRefund[0]?.data,
                totallistRefund: listRefund[0]?.count,
                skip: Number(skip),
                limit: Number(limit),
            });
            // }
        } catch (err) {
            console.log(err, "error");
            sendErrorResponse(res, 500, err);
        }
    },

    approveRefundRequest: async (req, res) => {
        try {
            const { requestId } = req.params;

            const { paymentReferenceNo } = req.body;

            if (!isValidObjectId(requestId)) {
                return sendErrorResponse(res, 400, "Invalid payment refund id");
            }
            const refendRequest = await Refund.findById(requestId);

            if (!refendRequest) {
                return sendErrorResponse(res, 404, "Payment service not found");
            }

            if (refendRequest.status === "success") {
                return sendErrorResponse(res, 404, "Refund Already Done");
            }

            console.log(
                refendRequest?.orderId,
                refendRequest?.activityId,
                "jjj"
            );
            const attractionOrder = await AttractionOrder.findOneAndUpdate(
                {
                    _id: refendRequest?.orderId,
                    activities: {
                        $elemMatch: {
                            _id: refendRequest?.activityId,
                            isRefundAvailable: true,
                        },
                    },
                },
                {
                    "activities.$.isRefunded": true,
                },
                { runValidators: true }
            );

            if (!attractionOrder) {
                return sendErrorResponse(
                    res,
                    404,
                    "Attraction Order Not Found"
                );
            }

            console.log(attractionOrder, "attraction");

            refendRequest.paymentReferenceNo = paymentReferenceNo;

            refendRequest.status = "success";

            const transaction = new B2CTransaction({
                user: refendRequest.userId,
                amount: refendRequest?.amount,
                status: "success",
                transactionType: "refund",
                paymentProcessor: "bank",
                orderId: refendRequest?._id,
            });

            await transaction.save();
            await refendRequest.save();

            res.status(200).json({
                messgae: "Refund Status Updated Sucessfully",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    cancelRefundRequest: async (req, res) => {
        try {
            const { requestId } = req.params;
            const { reason } = req.body;

            if (!isValidObjectId(requestId)) {
                return sendErrorResponse(res, 400, "Invalid payment refund id");
            }
            const refendRequest = await Refund.findById(requestId);

            if (!refendRequest) {
                return sendErrorResponse(res, 404, "Payment service not found");
            }

            if (refendRequest.status === "success") {
                return sendErrorResponse(res, 404, "Refund Already Done");
            }

            refendRequest.reason = reason;

            refendRequest.status = "failed";

            await refendRequest.save();
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
