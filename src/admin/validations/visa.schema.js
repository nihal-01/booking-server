const Joi = require("joi");

const visaSchema = Joi.object({
    country: Joi.string().required(),
    name: Joi.string().required(),
    documents: Joi.array()
        .min(1)
        .items({
            title: Joi.string().required(),
            body: Joi.string().required(),
        })
        .required(),
    inclusions: Joi.array().min(1).required(),
    description: Joi.string().required(),
    faqs: Joi.array()
        .min(1)
        .items({
            question: Joi.string().required(),
            answer: Joi.string().required(),
        })
        .required(),
    details: Joi.array()
        .min(1)
        .items({
            title: Joi.string().required(),
            body: Joi.string().required(),
        })
        .required(),
    keywords: Joi.array(),
});

const visaTypeSchema = Joi.object({
    visa: Joi.string().required(),
    visaName: Joi.string().required(),
    processingTimeFormat: Joi.string()
        .valid(...["hours", "days", "months"])
        .required(),
    processingTime: Joi.number().required(),
    stayPeriodFormat: Joi.string()
        .valid(...["hours", "days", "months"])
        .required(),
    stayPeriod: Joi.number().required(),
    validityTimeFormat: Joi.string()
        .valid(...["hours", "days", "months"])
        .required(),
    validity: Joi.number().required(),
    entryType: Joi.string()
        .valid(...["single", "multiple"])
        .required(),
    embassyCharge: Joi.number().required(),
    serviceCharge: Joi.number().required(),
    ageFrom: Joi.number().required(),
    ageTo: Joi.number().required(),
});

module.exports = { visaSchema, visaTypeSchema };
