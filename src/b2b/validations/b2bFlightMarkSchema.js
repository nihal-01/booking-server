const Joi = require("joi");

const b2bFightMarkupSchema = Joi.object({
    markupType: Joi.string().valid("flat", "percentage").required(),
    markup: Joi.number().required(),
    airLine: Joi.string().required(),
});

module.exports = { b2bFightMarkupSchema };
