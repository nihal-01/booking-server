const Joi = require("joi");

const availabilitySearchSchema = Joi.object({
    noOfAdults: Joi.number().required().min(1),
    noOfChildren: Joi.number().required(),
    noOfInfants: Joi.number().required(),
    type: Joi.string().required().valid("oneway", "return", "multicity"),
    from: Joi.when("type", {
        is: ["return", "oneway"],
        then: Joi.string().required(),
        otherwise: Joi.string().allow("", null),
    }),
    to: Joi.when("type", {
        is: ["return", "oneway"],
        then: Joi.string().required(),
        otherwise: Joi.string().allow("", null),
    }),
    departureDate: Joi.when("type", {
        is: ["return", "oneway"],
        then: Joi.date().required(),
        otherwise: Joi.string().allow("", null),
    }),
    returnDate: Joi.when("type", {
        is: "return",
        then: Joi.date().required(),
        otherwise: Joi.string().allow("", null),
    }),
    airItineraries: Joi.when("type", {
        is: "multicity",
        then: Joi.array()
            .items({
                from: Joi.string().required(),
                to: Joi.string().required(),
                departureDate: Joi.date().required(),
            })
            .min(2),
        otherwise: Joi.array().allow("", null),
    }),
});

module.exports = { availabilitySearchSchema };
