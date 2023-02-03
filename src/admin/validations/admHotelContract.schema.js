const Joi = require("joi");

const hotelContractSchema = Joi.object({
    dateFrom: Joi.date().required(),
    dateTo: Joi.date().required(),
    roomType: Joi.string().required(),
    price: Joi.number().required(),
    contractType: Joi.string()
        .valid("free-sale", "stop-sale", "contracted-rates")
        .required(),
    isNewUpdate: Joi.boolean().required(),
});

module.exports = { hotelContractSchema };
