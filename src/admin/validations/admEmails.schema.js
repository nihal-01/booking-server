const Joi = require("joi");

const emailSchema = Joi.object({
    email: Joi.string().email().required(),
    emailType: Joi.string().required(),
});

const sendEmailSchema = Joi.object({
    subject: Joi.string().required(),
    html: Joi.string().required(),
    emailType: Joi.string().required(),
    sendTo: Joi.string().valid("subscribers", "b2b", "b2c").required(),
});

module.exports = { emailSchema, sendEmailSchema };
