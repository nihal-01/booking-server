const Joi = require("joi");

const attractionOrderSchema = Joi.object({
    name: Joi.string().required(),
    phoneNumber: Joi.number().required(),
    country: Joi.string().required(),
    email: Joi.string().email().required(),
    selectedActivities: Joi.array()
        .min(1)
        .required()
        .items({
            activity: Joi.string().required(),
            date: Joi.date().required(),
            adultsCount: Joi.number().min(1).required(),
            childrenCount: Joi.number().allow("", null),
            infantCount: Joi.number().allow("", null),
            transferType: Joi.string().valid("without", "shared", "private"),
        }),
    paymentProcessor: Joi.string()
        .required()
        .valid("ccavenue", "paypal", "razorpay"),
});

const attractionOrderCaptureSchema = Joi.object({
    orderId: Joi.string().required(),
    paymentId: Joi.string().required(),
});

module.exports = {
    attractionOrderSchema,
    attractionOrderCaptureSchema,
};
