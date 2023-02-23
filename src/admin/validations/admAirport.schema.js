const Joi = require("joi");

const airportSchema = Joi.object({
    airportName: Joi.string().required(),
    iataCode: Joi.string().required(),
    icaoCode: Joi.string().required(),
    country: Joi.string().required(),
    place: Joi.string().required(),
    latitude: Joi.string().required(),
    longitude: Joi.string().required(),
});

module.exports = { airportSchema };
