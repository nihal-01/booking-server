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
                    attraction: Joi.string().required(),
                    activity: Joi.string().required(),
                    itineraryTitle: Joi.string().required(),
                    _id: Joi.string().allow("", null),
                    note: Joi.string().allow("", null),
                })
                .min(1),
            _id: Joi.string().allow("", null),
        })
        .min(1),
});

module.exports = { attractionItinerarySchema };
