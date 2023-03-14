const Joi = require("joi");

const attractionItinerarySchema = Joi.object({
    agentName: Joi.string().required(),
    agentEmail: Joi.string().required(),
    agentMobileNumber: Joi.string().allow("", null),
    queryDetails: Joi.string().required(),
    referenceNo: Joi.string().allow("", null),
    itineraries: Joi.array()
        .items({
            items: Joi.array()
                .items({
                    isCustom: Joi.boolean(),
                    attraction: Joi.string().allow("", null),
                    attractionTitle: Joi.string().allow("", null),
                    activity: Joi.string().allow("", null),
                    activityTitle: Joi.string().allow("", null),
                    itineraryTitle: Joi.string().allow("", null),
                    _id: Joi.string().allow("", null),
                    note: Joi.string().allow("", null),
                    description: Joi.string().allow("", null),
                    images: Joi.array().allow("", null),
                })
                .min(1),
            _id: Joi.string().allow("", null),
        })
        .min(1),
});

module.exports = { attractionItinerarySchema };
