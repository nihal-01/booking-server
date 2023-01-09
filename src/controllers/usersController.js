const { compare, hash } = require("bcryptjs");

const { sendErrorResponse } = require("../helpers");
const { User, Country } = require("../models");
const {
    userLoginSchema,
    userSignupSchema,
    userUpdateSchema,
    userPasswordUpdateSchema,
} = require("../validations/user.schema");
const { isValidObjectId } = require("mongoose");

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
                return sendErrorResponse(res, 400, "Invalid credentials");
            }

            const isMatch = await compare(password, user.password);
            if (!isMatch) {
                return sendErrorResponse(res, 400, "Invalid credentials");
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
};
