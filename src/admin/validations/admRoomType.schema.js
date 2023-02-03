const Joi = require("joi");

const roomTypeSchema = Joi.object({
    hotel: Joi.string().required(),
    roomName: Joi.string().required(),
    roomOccupancy: Joi.string()
        .valid("DBL", "SGL", "TPL", "CWB", "CNB")
        .required(),
    inclusions: Joi.array().items(Joi.string()),
    noOfSleeps: Joi.number().required(),
    isRefundable: Joi.boolean().required(),
    isBreakFastIncluded: Joi.boolean().required(),
    area: Joi.number().required(),
    images: Joi.array().items(Joi.string()),
});

module.exports = { roomTypeSchema };
