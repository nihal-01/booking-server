const Joi = require("joi");

const passwordRegx =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const passswordError = new Error(
    "Password must be strong. At least one alphabet. At least one digit. At least one special character. Minimum eight in length"
);

const userSignupSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(passwordRegx).error(passswordError).required(),
    country: Joi.string().required(),
    phoneNumber: Joi.string().required(),
});

const userLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const userUpdateSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    country: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    avatar: Joi.string().allow("", null),
});

const userPasswordUpdateSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string()
        .regex(passwordRegx)
        .error(passswordError)
        .required(),
});

const userForgetPasswordSchema = Joi.object({
    otp: Joi.number().required(),
    email: Joi.string().required(),
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
    userLoginSchema,
    userSignupSchema,
    userUpdateSchema,
    userPasswordUpdateSchema,
    userForgetPasswordSchema,
};
