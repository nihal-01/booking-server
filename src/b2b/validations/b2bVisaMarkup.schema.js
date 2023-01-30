const Joi = require("joi");

const b2bVisaMarkupSchema = Joi.object({
    markupType: Joi.string().valid("flat", "percentage").required(),
    markup: Joi.number().required(),
    visaType: Joi.string().required(),
});

module.exports = { b2bVisaMarkupSchema };