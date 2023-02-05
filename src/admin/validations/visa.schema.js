const Joi = require("joi");

const visaSchema = Joi.object({
    country: Joi.string().required(),
    name: Joi.string().required(),
    // documents: Joi.array()
    //     .min(1)
    //     .items({
    //         title: Joi.string().required(),
    //         body: Joi.string().required(),
    //     })
    //     .required(),
    inclusions: Joi.array().min(1).required(),
    description: Joi.string().required(),
    faqs: Joi.array()
        .min(1)
        .items({
            question: Joi.string().required(),
            answer: Joi.string().required(),
        })
        .required(),
    termsAndConditions : Joi.string().required(),
    details: Joi.array()
        .min(1)
        .items({
            title: Joi.string().required(),
            body: Joi.string().required(),
        })
        .required(),
    // keywords: Joi.array(),
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
    tax: Joi.number().required(),
    insurance: Joi.number().required(),
    purchaseCost: Joi.number().required(),
    visaPrice: Joi.number().required(),
    ageFrom: Joi.number().required(),
    ageTo: Joi.number().required(),
});


const visaUpdateSchema = Joi.object({
    country: Joi.string().required(),
    name: Joi.string().required(),
    termsAndConditions : Joi.string().required(),
    // documents: Joi.array()
    //     .min(1)
    //     .items({
    //         title: Joi.string().required(),
    //         body: Joi.string().required(),
    //     })
    //     .required(),
    inclusions: Joi.array().min(1).required(),
    image : Joi.string().allow("", null),

    description: Joi.string().required(),
    faqs: Joi.array()
        .min(1)
        .items({
            _id: Joi.string().required(),
            question: Joi.string().required(),
            answer: Joi.string().required(),
        })
        .required(),
    
    details: Joi.array()
        .min(1)
        .items({
            _id: Joi.string().required(),
            title: Joi.string().required(),
            body: Joi.string().required(),
        })
        .required(),
        
    // keywords: Joi.array(),
});




module.exports = { visaSchema, visaTypeSchema , visaUpdateSchema };
