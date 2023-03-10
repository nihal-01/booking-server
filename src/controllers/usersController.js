const { compare, hash } = require("bcryptjs");

const { sendErrorResponse, sendMobileOtp } = require("../helpers");
const { User, Country } = require("../models");
const {
    userLoginSchema,
    userSignupSchema,
    userUpdateSchema,
    userPasswordUpdateSchema,
    userForgetPasswordSchema,
} = require("../validations/user.schema");
const { isValidObjectId } = require("mongoose");
const userSignUpEmail = require("../helpers/SignupEmail");
const sendForgetPasswordOtp = require("../b2b/helpers/sendForgetPasswordMail");

module.exports = {
    doSignup: async (req, res) => {
        try {
            const { name, email, password, country, phoneNumber } = req.body;

            const { _, error } = userSignupSchema.validate(req.body);

            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

            const user = await User.findOne({ email });
            if (user) {
                return sendErrorResponse(res, 400, "Email already exists");
            }

            if (!isValidObjectId(country)) {
                return sendErrorResponse(res, 400, "Country not found");
            }

            const countryDetails = await Country.findOne({ isDeleted: false });
            if (!countryDetails) {
                return sendErrorResponse(res, 404, "Country not found");
            }

            const hashedPassowrd = await hash(password, 8);

            const newUser = new User({
                name,
                email,
                password: hashedPassowrd,
                country,
                phoneNumber,
            });

            const jwtToken = await newUser.generateAuthToken();
            newUser.jwtToken = jwtToken;
            await newUser.save();

            userSignUpEmail(
                email,
                "User SignUp Mail",
                " You have been successfully registered new account ."
            );

            res.status(200).json({ newUser, jwtToken });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    doLogin: async (req, res) => {
        try {
            const { email, password } = req.body;

            const { _, error } = userLoginSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

            const user = await User.findOne({ email });
            if (!user) {
                return sendErrorResponse(res, 400, "Invalid Email");
            }

            const isMatch = await compare(password, user.password);
            if (!isMatch) {
                return sendErrorResponse(res, 400, "Invalid Password");
            }

            const jwtToken = await user.generateAuthToken();
            await user.save();

            res.status(200).json({ user, jwtToken });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAccount: async (req, res) => {
        try {
            res.status(200).json(req.user);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateUser: async (req, res) => {
        try {
            const { name, email, phoneNumber, country } = req.body;

            const { _, error } = userUpdateSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            let avatarImg;
            if (req.file?.path) {
                avatarImg = "/" + req.file.path.replace(/\\/g, "/");
            }

            if (country) {
                const countryDetails = await Country.findOne({
                    _id: country,
                    isDeleted: false,
                });
                if (!countryDetails) {
                    return sendErrorResponse(
                        res,
                        404,
                        "Country details not found"
                    );
                }
            }

            const user = await User.findOneAndUpdate(
                { _id: req.user._id },
                { name, email, country, phoneNumber, avatar: avatarImg },
                { runValidators: true, new: true }
            );
            if (!user) {
                return sendErrorResponse(res, 404, "User not found");
            }

            res.status(200).json(user);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updatePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;

            const { _, error } = userPasswordUpdateSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

            const isMatch = await compare(oldPassword, req.user.password);
            if (!isMatch) {
                return sendErrorResponse(res, 400, "Old password is incorrect");
            }

            const hashedPassowrd = await hash(newPassword, 8);
            const user = await User.findOneAndUpdate(
                { _id: req.user._id },
                { password: hashedPassowrd }
            );

            if (!user) {
                return sendErrorResponse(res, 404, "User not found");
            }

            res.status(200).json({ message: "Password updated successfully" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    forgetPassword: async (req, res) => {
        try {
            const { email } = req.body;
            let user = await User.findOne({ email: email });

            if (!user) {
                return sendErrorResponse(res, 400, "User Not Found");
            }

            const otp = 12345;

            user.otp = otp;

            await sendForgetPasswordOtp(email, otp);

            await user.save();

            res.status(200).json({
                message: "Verification OTP Send To Your Email",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    completeForgetPassword: async (req, res) => {
        try {
            const { email, otp, confirmPassword, newPassword } = req.body;

            const { _, error } = userForgetPasswordSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

            const user = await User.findOne({ email });

            if (!user) {
                return sendErrorResponse(res, 400, "Account not found");
            }

            console.log(user, otp, "otp");

            if (Number(user.otp) != Number(otp)) {
                return sendErrorResponse(res, 400, "OTP Is Wrong");
            }

            const hashedPassowrd = await hash(newPassword, 8);

            user.password = hashedPassowrd;

            await user.save();

            res.status(200).json({ message: "Password Updated Sucessfully" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
