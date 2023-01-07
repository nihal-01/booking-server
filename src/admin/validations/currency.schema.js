const Joi = require("joi");

const currencySchema = Joi.object({
    currencyName: Joi.string().required(),
    currencySymbol: Joi.string().required(),
    isocode: Joi.string().required(),
    country: Joi.string().required(),
    conversionRate: Joi.number().required(),
});

module.exports = { currencySchema };
