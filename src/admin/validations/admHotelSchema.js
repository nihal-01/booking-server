const Joi = require("joi");

const hotelSchema = Joi.object({
    hotelName: Joi.string().required(),
    address: Joi.string().required(),
    place: Joi.string().required(),
    destination: Joi.string().required(),
    longitude: Joi.string().required(),
    latitude: Joi.string().required(),
    description: Joi.string().required(),
    faqs: Joi.array().items(
        Joi.object({
            question: Joi.string().required(),
            answer: Joi.string().required(),
        })
    ),
    checkInTime: Joi.string().required(),
    checkOutTime: Joi.string().required(),
    isAgeRestriction: Joi.boolean().required(),
    isPetsAllowed: Joi.boolean().required(),
    isCashAllowedOnly: Joi.boolean().required(),
    facilities: Joi.array().items(Joi.string()),
    website: Joi.string().allow("", null),
    starCategory: Joi.string().required(),
    roomsCount: Joi.number().allow("", null),
    floorsCount: Joi.number().allow("", null),
    carParkingSlots: Joi.number().allow("", null),
});

module.exports = { hotelSchema };
