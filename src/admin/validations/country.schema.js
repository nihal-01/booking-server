const Joi = require("joi");

const countrySchema = Joi.object({
    countryName: Joi.string().required(),
    isocode: Joi.string().required(),
    phonecode: Joi.string().required(),
    flag: Joi.string().required(),
});

module.exports = { countrySchema };
