const Joi = require("joi");

const airlineSchema = Joi.object({
    icaoCode: Joi.string().required(),
    airlineCode: Joi.number().required(),
    iataDesignator: Joi.string().required(),
    flightName: Joi.string().required(),
    api: Joi.string().required(),
    image: Joi.string().allow("", null),
});

module.exports = { airlineSchema };
