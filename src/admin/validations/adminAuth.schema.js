const Joi = require("joi");

const passwordRegx =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const passswordError = new Error(
    "Password must be strong. At least one alphabet. At least one digit. At least one special character. Minimum eight in length"
);

const adminAddSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().regex(passwordRegx).error(passswordError).required(),
    name: Joi.string().required(),
});

const adminLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const adminPasswordUpdateSchema = Joi.object({
    oldPassword: Joi.string()
        .regex(passwordRegx)
        .error(passswordError)
        .required(),
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
    adminAddSchema,
    adminLoginSchema,
    adminPasswordUpdateSchema,
};
