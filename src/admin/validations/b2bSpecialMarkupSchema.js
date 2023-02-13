const Joi = require("joi");

const b2bSpecialMarkupSchema = Joi.object({
    markupType: Joi.string().valid("flat", "percentage").required(),
    markup: Joi.number().required(),
    resellerId: Joi.string().required(),
});

module.exports = { b2bSpecialMarkupSchema };