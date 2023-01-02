const Joi = require("joi");

const attractionOrderSchema = Joi.object({
    attraction: Joi.string().required(),
    selectedActivities: Joi.array()
        .min(1)
        .required()
        .items({
            activity: Joi.string().required(),
            date: Joi.date().required(),
            adultsCount: Joi.number().required(),
            childrenCount: Joi.number().required(),
            infantCount: Joi.number().required(),
            transferType: Joi.string().valid(...["without", "shared", "private"]),
        }),
});

const attractionOrderPaymentSchema = Joi.object({
    attractionOrderId: Joi.string().required(),
    name: Joi.string(),
    email: Joi.string(),
    phoneNumber: Joi.string(),
    country: Joi.string(),
});

const attractionOrderCaptureSchema = Joi.object({
    orderId: Joi.string().required(),
    paymentId: Joi.string(),
});

module.exports = {
    attractionOrderSchema,
    attractionOrderPaymentSchema,
    attractionOrderCaptureSchema,
};
