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
    telephoneNumber: Joi.string().allow("", null),
    trnNumber: Joi.string().allow("", null),
    companyRegistration: Joi.string().allow("", null),
});

const resellerLoginSchema = Joi.object({
    agentCode: Joi.number().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
});

const subAgentRegisterSchema = Joi.object({
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
    telephoneNumber : Joi.string().allow("", null),
    country: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    trnNumber: Joi.string().allow("", null),
    companyRegistration: Joi.string().allow("", null),
});

const resellerProfileUpdateSchema = Joi.object({
    name: Joi.string().required(),
    whatsappNumber: Joi.string().required(),
    designation: Joi.string().required(),
    country: Joi.string().required(),
    skypeId: Joi.string().allow("", null),
    email: Joi.string().email().required(),
    telephoneNumber: Joi.string().allow("", null),
    phoneNumber: Joi.string().required(),
});

const resellerCompanyUpdateSchema = Joi.object({
    companyName: Joi.string().required(),
    address: Joi.string().required(),
    website: Joi.string().required(),
    city: Joi.string().required(),
    zipCode: Joi.number().required(),
    // country: Joi.string().required(),
    trnNumber: Joi.string(),
    companyRegistration: Joi.string(),
});

const resellerPasswordUpdateSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string()
        .regex(passwordRegx)
        .error(passswordError)
        .required(),
    confirmPassword: Joi.string()
        .valid(Joi.ref("newPassword"))
        .error(new Error("Confirm password must be equal to new password"))
        .required(),
});

module.exports = {
    resellerRegisterSchema,
    resellerLoginSchema,
    subAgentRegisterSchema,
    resellerProfileUpdateSchema,
    resellerCompanyUpdateSchema,
    resellerPasswordUpdateSchema,
};
