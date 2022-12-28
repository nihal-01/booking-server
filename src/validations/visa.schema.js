const Joi = require("joi");

const visaApplicationInititeSchema = Joi.object({
    email: Joi.string().email().required(),
    contactNo: Joi.string().required(),
    visa: Joi.string().required(),
    visaType: Joi.string().required(),
    noOfTravellers: Joi.number().required(),
});

const visaDetailsSubmissionSchema = Joi.object({
    visaType: Joi.string().required(),
    noOfTravellers: Joi.number().required(),
    onwardDate: Joi.date().required(),
    returnDate: Joi.date().required(),
    travellers: Joi.array().items({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        dateOfBirth: Joi.object({
            day: Joi.number().required(),
            month: Joi.number().required(),
            year: Joi.number().required(),
        }),
        country: Joi.string().required(),
        passportNo: Joi.string().required(),
        contactNo: Joi.number().required(),
        email: Joi.string().required(),
    }),
});

export { visaApplicationInititeSchema, visaDetailsSubmissionSchema };
