const Joi = require("joi");

const b2bAttractionOrderSchema = Joi.object({
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
            childrenCount: Joi.number(),
            infantCount: Joi.number(),
            transferType: Joi.string()
                .valid("without", "shared", "private")
                .required(),
        }),
});

const b2bAttractionOrderCaptureSchema = Joi.object({
    orderId: Joi.string().required(),
    paymentId: Joi.string().required(),
});

module.exports = {
    b2bAttractionOrderSchema,
    b2bAttractionOrderCaptureSchema,
};
