const Joi = require("joi");

const paymentServiceSchema = Joi.object({
    name: Joi.string().required(),
    paymentProcessor: Joi.string()
        .valid("razorpay", "paypal", "stripe")
        .required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    processingFee: Joi.string().required(),
});

module.exports = { paymentServiceSchema };
