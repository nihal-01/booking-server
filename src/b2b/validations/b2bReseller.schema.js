const Joi = require("joi");

const passwordRegx =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const passswordError = new Error(
    "Password must be strong. At least one alphabet. At least one digit. At least one special character. Minimum eight in length"
);

const resellerRegisterSchema = Joi.object({
    name: Joi.string().required(),
    companyName: Joi.string().required(),
    address: Joi.string().required(),
    website: Joi.string().required(),
    whatsappNumber: Joi.string().required(),
    city: Joi.string().required(),
    designation: Joi.string().required(),
    zipCode: Joi.number().required(),
    skypeId: Joi.string().allow("", null),
    email: Joi.string().email().required(),
    password: Joi.string().regex(passwordRegx).error(passswordError).required(),
    country: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    trnNumber: Joi.string(),
    companyRegistration: Joi.string(),
});

const resellerLoginSchema = Joi.object({
    agentCode: Joi.number().required(),
    email: Joi.string().required(),
    password: Joi.string().regex(passwordRegx).error(passswordError).required(),
});

const resellerProfileUpdateSchema = Joi.object({
    name: Joi.string().required(),
    whatsappNumber: Joi.string().required(),
    designation: Joi.string().required(),
    zipCode: Joi.number().required(),
    skypeId: Joi.string().allow("", null),
    email: Joi.string().email().required(),
    country: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    
});

const resellerCompanyUpdateSchema = Joi.object({
    companyName: Joi.string().required(),
    address: Joi.string().required(),
    website: Joi.string().required(),
    city: Joi.string().required(),
    designation: Joi.string().required(),
    trnNumber: Joi.string(),
    companyRegistration: Joi.string(),
});

const resellerPasswordUpdateSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string()
        .regex(passwordRegx)
        .error(passswordError)
        .required(),
});




module.exports = {
    resellerRegisterSchema,
    resellerLoginSchema,
    resellerProfileUpdateSchema,
    resellerCompanyUpdateSchema,
    resellerPasswordUpdateSchema

};
