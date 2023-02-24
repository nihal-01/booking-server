const { sendErrorResponse } = require("../../helpers");
const {
    paymentServiceSchema,
} = require("../validations/admPaymentService.schema");
const { PaymentService, Refund, B2CTransaction } = require("../../models");
const { isValidObjectId } = require("mongoose");
module.exports = {
    listRefundAll: async (req, res) => {
        try {
            const {
                skip = 0,
                limit = 10,
                orderedBy = "b2c",
                status,
                category,
            } = req.query;

            const filters = {};

            if (status && status !== "") {
                filters.status = status;
            }

            if (category && category !== "") {
                filters.category = category;
            }

            if (orderedBy == "b2c") {
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
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                ]);

                console.log(listRefund, "listRefund");

                res.status(200).json(listRefund);
            }
        } catch (err) {
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
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    cancelRefund: async (req, res) => {
        try {
            const { requestId, reason } = req.params;

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
