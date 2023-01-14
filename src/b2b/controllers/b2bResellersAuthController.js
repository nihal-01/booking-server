const { hash, compare } = require("bcryptjs");

const { sendErrorResponse } = require("../../helpers");
const { Reseller } = require("../models");
const {
    resellerRegisterSchema,
    resellerLoginSchema,
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
                resellerId,
            } = req.body;

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
                resellerId,
                trnNumber,
                companyRegistration,
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
                return sendErrorResponse(res, 400, "Invalid credentials");
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
};
