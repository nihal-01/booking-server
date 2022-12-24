const Joi = require("joi");

const subscriberSchema = Joi.object({
    email: Joi.string().email().required(),
});

module.exports = { subscriberSchema };
