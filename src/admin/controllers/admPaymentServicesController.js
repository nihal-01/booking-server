const { sendErrorResponse } = require("../../helpers");
const {
    paymentServiceSchema,
} = require("../validations/admPaymentService.schema");
const { PaymentService } = require("../../models");
const { isValidObjectId } = require("mongoose");

module.exports = {
    addPaymentService: async (req, res) => {
        try {
            const {
                name,
                paymentProcessor,
                clientId,
                clientSecret,
                processingFee,
            } = req.body;

            const { _, error } = paymentServiceSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const prevPaymentService = await PaymentService.findOne({
                paymentProcessor,
            });
            if (prevPaymentService) {
                return sendErrorResponse(
                    res,
                    400,
                    "Already a payment service added with this payment processor"
                );
            }

            const newPaymentService = new PaymentService({
                name,
                paymentProcessor,
                clientId,
                clientSecret,
                processingFee,
            });
            await newPaymentService.save();

            res.status(200).json(newPaymentService);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updatePaymentService: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name,
                paymentProcessor,
                clientId,
                clientSecret,
                processingFee,
            } = req.body;

            const { _, error } = paymentServiceSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid payment service id"
                );
            }

            const prevPaymentService = await PaymentService.findOne({
                _id: { $ne: id },
                paymentProcessor,
            });
            if (prevPaymentService) {
                return sendErrorResponse(
                    res,
                    400,
                    "Already a payment service added with this payment processor"
                );
            }

            const paymentService = await PaymentService.findByIdAndUpdate(
                id,
                {
                    name,
                    paymentProcessor,
                    clientId,
                    clientSecret,
                    processingFee,
                },
                { timestamps: true, new: true, runValidators: true }
            );
            if (!paymentService) {
                return sendErrorResponse(res, 404, "Payment service not found");
            }

            res.status(200).json(paymentService);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deletePaymentService: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid payment service id"
                );
            }

            const paymentService = await PaymentService.findByIdAndDelete(id);
            if (!paymentService) {
                return sendErrorResponse(res, 400, "Payment service not found");
            }

            res.status(200).json({
                message: "Payment service deleted successfully",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllPaymentServices: async (req, res) => {
        try {
            const paymentServices = await PaymentService.find({}).sort({
                createdAt: -1,
            });
            res.status(200).json(paymentServices);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
