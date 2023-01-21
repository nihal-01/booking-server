const Joi = require("joi");

const emailServiceSchema = Joi.object({
    serviceProvider: Joi.string().allow("twilio").required(),
    apiKey: Joi.string().required(),
});

module.exports = { emailServiceSchema };
