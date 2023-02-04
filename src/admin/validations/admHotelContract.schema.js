const Joi = require("joi");

const hotelContractSchema = Joi.object({
    dateFrom: Joi.date().required(),
    dateTo: Joi.date().required(),
    roomType: Joi.string().required(),
    contractType: Joi.string()
        .valid("free-sale", "stop-sale", "contracted-rates")
        .required(),
    price: Joi.number().allow("", null).when("contractType", {
        is: Joi.string().valid("free-sale", "contracted-rates"),
        then: Joi.number().required(),
    }),
    // isRoPriceAvailable: Joi.boolean().required(),
    // roPrice: Joi.number().when("isRoPriceAvailable", {
    //     is: Joi.boolean().valid(true),
    //     then: Joi.number().required(),
    // }),
    // isBbPriceAvailable: Joi.boolean().required(),
    // bbPrice: Joi.number().when("isBbPriceAvailable", {
    //     is: Joi.boolean().valid(true),
    //     then: Joi.number().required(),
    // }),
    // isNewUpdate: Joi.boolean().required(),
});

module.exports = { hotelContractSchema };
