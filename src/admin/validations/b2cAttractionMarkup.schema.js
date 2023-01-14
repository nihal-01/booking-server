const Joi = require("joi");

const b2cAttractionMarkupSchema = Joi.object({
    markupType: Joi.string().valid("flat", "percentage").required(),
    markup: Joi.number().required(),
    attraction: Joi.string().required(),
});

module.exports = { b2cAttractionMarkupSchema };
