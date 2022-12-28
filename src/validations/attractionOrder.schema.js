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
            transferType: Joi.string().valid(...["", "shared", "private"]),
        }),
});

module.exports = { attractionOrderSchema };
