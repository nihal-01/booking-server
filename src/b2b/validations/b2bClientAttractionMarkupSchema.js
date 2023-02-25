const Joi = require("joi");

const b2bClientAttractionMarkupSchema = Joi.object({
    markupType: Joi.string().valid("flat", "percentage").required(),
    markup: Joi.number().required(),
    attraction: Joi.string().required(),
});

module.exports = { b2bClientAttractionMarkupSchema };
