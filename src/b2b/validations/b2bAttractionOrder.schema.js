const Joi = require("joi");

const b2bAttractionOrderSchema = Joi.object({
    // name: Joi.string().allow("", null),
    // phoneNumber: Joi.number().allow("", null),
    // country: Joi.string().allow("", null),
    // email: Joi.string().email().allow("", null),
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
});

const b2bAttractionOrderCaptureSchema = Joi.object({
    orderId: Joi.string().required(),
    paymentId: Joi.string().required(),
});

module.exports = {
    b2bAttractionOrderSchema,
    b2bAttractionOrderCaptureSchema,
};