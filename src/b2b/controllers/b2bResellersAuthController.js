const { hash, compare } = require("bcryptjs");
const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Country } = require("../../models");
const { Reseller } = require("../models");
const {
    resellerRegisterSchema,
    resellerLoginSchema,
    resellerProfileUpdateSchema,
    resellerCompanyUpdateSchema,
    resellerPasswordUpdateSchema,
} = require("../validations/b2bReseller.schema");

module.exports = {
    resellerRegister: async (req, res) => {
        try {
            const {
                email,
                companyName,
                address,
                companyRegistration,
                trnNumber,
                website,
                country,
                city,
                zipCode,
                designation,
                name,
                phoneNumber,
                skypeId,
                whatsappNumber,
                password,
            } = req.body;

            console.log(req.body , "bodyy")

            const { _, error } = resellerRegisterSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

            const resellerReg = await Reseller.findOne({ email });

            if (resellerReg) {
                return sendErrorResponse(res, 400, "Email already exists");
            }

            const hashedPassowrd = await hash(password, 8);

            const newReseller = new Reseller({
                email,
                companyName,
                address,
                website,
                country,
                city,
                zipCode,
                designation,
                name,
                phoneNumber,
                skypeId,
                whatsappNumber,
                trnNumber,
                companyRegistration,
                role : "reseller",
                password: hashedPassowrd,
                status: "pending",
            });

            await newReseller.save();
            res.status(200).json({
                message: "Your requeset has been successfully submitted",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    resellerLogin: async (req, res) => {
        try {
            const { agentCode, email, password } = req.body;

            const { _, error } = resellerLoginSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

            const reseller = await Reseller.findOne({ email });
            if (!reseller) {
                return sendErrorResponse(res, 400, "Invalid credentials");
            }

            if (reseller.agentCode !== Number(agentCode)) {
                return sendErrorResponse(res, 400, "Invalid credentials ");
            }

            const isMatch = await compare(password, reseller.password);
            if (!isMatch) {
                return sendErrorResponse(res, 400, "Invalid Password credentials");
            }

            if (reseller.status !== "ok") {
                return sendErrorResponse(
                    res,
                    400,
                    "Your account is currently disabled or under verification. Please contact support team if you have any queries"
                );
            }

            const jwtToken = await reseller.generateAuthToken();
            await reseller.save();

            res.status(200).json({ reseller, jwtToken });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateProfileSetting: async (req, res) => {
        try {
            const {
                name,
                email,
                skypeId,
                whatsappNumber,
                designation,
                phoneNumber,
                telephoneNumber,
                country,
            } = req.body;

            const { _, error } = resellerProfileUpdateSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            let avatarImg;
            if (req.file?.path) {
                avatarImg = "/" + req.file.path.replace(/\\/g, "/");
            }

            if (country) {
                if (!isValidObjectId(country)) {
                    return sendErrorResponse(res, 400, "Invalid country id");
                }

                const countryDetails = await Country.findById(country);
                if (!countryDetails) {
                    return sendErrorResponse(res, 404, "Country not found");
                }
            }

            const reseller = await Reseller.findOneAndUpdate(
                { _id: req.reseller._id },
                {
                    name,
                    email,
                    phoneNumber,
                    skypeId,
                    whatsappNumber,
                    telephoneNumber,
                    designation,
                    avatarImg,
                    country,
                },
                { runValidators: true, new: true }
            );
            if (!reseller) {
                return sendErrorResponse(res, 404, "User not found");
            }

            res.status(200).json(reseller);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateCompanySettings: async (req, res) => {
        try {
            const {
                companyName,
                address,
                companyRegistration,
                trnNumber,
                website,
                city,
                zipCode,
            } = req.body;

            const { _, error } = resellerCompanyUpdateSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const reseller = await Reseller.findOneAndUpdate(
                { _id: req.reseller._id },

                {
                    companyName,
                    address,
                    companyRegistration,
                    trnNumber,
                    website,
                    city,
                    zipCode,
                },
                { runValidators: true, new: true }
            );

            if (!reseller) {
                return sendErrorResponse(res, 404, "Reseller not found");
            }

            res.status(200).json(reseller);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updatePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;

            const { _, error } = resellerPasswordUpdateSchema.validate(
                req.body
            );
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

            const isMatch = await compare(oldPassword, req.reseller.password);
            if (!isMatch) {
                return sendErrorResponse(res, 400, "Old password is incorrect");
            }

            const hashedPassowrd = await hash(newPassword, 8);
            const reseller = await Reseller.findOneAndUpdate(
                { _id: req.reseller._id },
                { password: hashedPassowrd }
            );

            if (!reseller) {
                return sendErrorResponse(res, 404, "User not found");
            }

            res.status(200).json({ message: "Password updated successfully" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getReseller: async (req, res) => {
        try {
            res.status(200).json(req.reseller);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};