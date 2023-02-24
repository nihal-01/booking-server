const Joi = require("joi");

const airlineSchema = Joi.object({
    airlineName: Joi.string().required(),
    airlineCode: Joi.number().required(),
    iataCode: Joi.string().required(),
    icaoCode: Joi.string().required(),
    api: Joi.string().required(),
    image: Joi.string().allow("", null),
});

module.exports = { airlineSchema };
