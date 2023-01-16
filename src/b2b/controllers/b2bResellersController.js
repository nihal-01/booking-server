const { hash } = require("bcryptjs");
const crypto = require("crypto");

const { sendErrorResponse } = require("../../helpers");
const { sendSubAgentPassword } = require("../helpers");
const { Reseller } = require("../models");
const { subAgentRegisterSchema } = require("../validations/b2bReseller.schema");

module.exports = {
    registerSubAgent: async (req, res) => {
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
            } = req.body;

            const { _, error } = subAgentRegisterSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

            const prevReseller = await Reseller.findOne({ email });

            if (prevReseller) {
                return sendErrorResponse(res, 400, "Email already exists");
            }

            const password = crypto.randomBytes(6).toString("hex");
            const hashedPassowrd = await hash(password, 8);

            sendSubAgentPassword({ email, password });

            const newSubAgent = new Reseller({
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
                referredBy: req.reseller._id,
                trnNumber,
                companyRegistration,
                role: "sub-agent",
                password: hashedPassowrd,
                status: "pending",
            });

            await newSubAgent.save();
            res.status(200).json({
                message: "Your requeset has been successfully submitted",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
