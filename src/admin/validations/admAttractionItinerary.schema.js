const Joi = require("joi");

const attractionItinerarySchema = Joi.object({
    clientName: Joi.string().required(),
    clientEmail: Joi.string().required(),
    clientMobileNumber: Joi.string().allow("", null),
    title: Joi.string().required(),
    subTitle: Joi.string().allow("", null),
    itineraries: Joi.array()
        .items({
            items: Joi.array()
                .items({
                    attraction: Joi.string().required(),
                    activity: Joi.string().required(),
                    itineraryTitle: Joi.string().required(),
                })
                .min(1),
        })
        .min(1),
});

module.exports = { attractionItinerarySchema };
