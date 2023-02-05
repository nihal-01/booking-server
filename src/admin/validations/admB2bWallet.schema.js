const Joi = require("joi");

const addMoneyToWalletSchema = Joi.object({
    resellerId: Joi.string().required(),
    amount: Joi.number().required().min(1),
    paymentProcessor: Joi.string().required().valid("bank", "cash-in-hand"),
    referenceNo: Joi.string()
        .allow("", null)
        .when("paymentProcessor", {
            is: Joi.string().valid("bank"),
            then: Joi.string().required(),
        }),
});

module.exports = { addMoneyToWalletSchema };
