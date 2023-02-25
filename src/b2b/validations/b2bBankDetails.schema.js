const Joi = require("joi");

const b2bBankDetailsValidationSchema = Joi.object({
    amount: Joi.number().required(),
    bankDeatilId: Joi.string().optional(),
    bankName: Joi.string().required(),
    isoCode: Joi.string().required(),
    // bankCountry: Joi.string().valid("India", "United Arab Emirates").required(),
    accountHolderName: Joi.string().required(),
    accountNumber: Joi.string().required(),
    ifscCode: Joi.when("bankCountry", {
        is: "India",
        then: Joi.string().required(),
        otherwise: Joi.string().allow(null, ""),
    }),
    ibanCode: Joi.when("bankCountry", {
        is: "UAE",
        then: Joi.string().required(),
        otherwise: Joi.string().allow(null, ""),
    }),
});

module.exports = b2bBankDetailsValidationSchema;
