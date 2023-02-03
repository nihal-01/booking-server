const Joi = require("joi");

const hotelFacilitySchema = Joi.object({
    name: Joi.string().required(),
    icon: Joi.string().allow("", null),
});

module.exports = { hotelFacilitySchema };
