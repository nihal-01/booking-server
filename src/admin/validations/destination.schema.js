const Joi = require("joi");

const destinationSchema = Joi.object({
    country: Joi.string().required(),
    name: Joi.string().required(),
});

module.exports = { destinationSchema };
