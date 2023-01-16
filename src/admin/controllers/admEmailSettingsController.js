const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { EmailSettings, EmailSendList } = require("../models/");
const {
    emailSettingsSchema,
    sendEmailSchema,
} = require("../validations/admEmailSettings.schema");
const { Subscriber, User } = require("../../models");
const { Reseller } = require("../../b2b/models");
const { sendCustomEmail } = require("../helpers");

module.exports = {
    addNewMail: async (req, res) => {
        try {
            const { email, password, emailType } = req.body;

            const { _, error } = emailSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const prevEmailSettings = await EmailSettings.findOne({
                emailType: emailType?.toLowerCase(),
            });
            if (prevEmailSettings) {
                return sendErrorResponse(
                    res,
                    400,
                    "An email settings already added with this type"
                );
            }

            const emailSettings = new EmailSettings({
                email,
                password,
                emailType,
            });
            await emailSettings.save();

            res.status(200).json(emailSettings);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateEmailSettings: async (req, res) => {
        try {
            const { id } = req.params;
            const { email, password, emailType } = req.body;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid email settings id");
            }

            const { _, error } = emailSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const prevEmailSettings = await EmailSettings.findOne({
                _id: { $ne: id },
                emailType: emailType?.toLowerCase(),
            });
            if (prevEmailSettings) {
                return sendErrorResponse(
                    res,
                    400,
                    "An email settings already added with this type"
                );
            }

            const emailSettings = await EmailSettings.findByIdAndUpdate(
                id,
                {
                    email,
                    password,
                    emailType,
                },
                { runValidators: true, new: true }
            );
            if (!emailSettings) {
                return sendErrorResponse(res, 404, "Email settings not found");
            }

            res.status(200).json(emailSettings);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteEmailSettings: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid email settings id");
            }

            const emailSettings = await EmailSettings.findByIdAndDelete(id);
            if (!emailSettings) {
                return sendErrorResponse(res, 400, "Email Settings not found");
            }

            res.status(200).json({
                message: "Email settings successfully deleted",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    emailSettingsSendMail: async (req, res) => {
        try {
            const { subject, html, emailType, sendTo } = req.body;

            const { _, error } = sendEmailSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const emailSettings = await EmailSettings.findOne({
                emailType: emailType?.toLowerCase(),
            });
            if (!emailSettings) {
                return sendErrorResponse(res, 404, "Email settings not found");
            }

            let mailList = [];
            if (sendTo === "subscribers") {
                mailList = await Subscriber.find({
                    subscribed: true,
                }).distinct("email");
            } else if (sendTo === "b2b") {
                mailList = await Reseller.find({ status: "ok" }).distinct(
                    "email"
                );
            } else if (sendTo === "b2c") {
                mailList = await User.distinct("email");
            }

            await sendCustomEmail({
                senderEmail: emailSettings.email,
                senderPassword: emailSettings.password,
                subject,
                html,
                mailList,
            });

            const newEmailList = new EmailSendList({
                sentFrom: emailSettings.email,
                subject,
                html,
                emailType,
                sentTo: sendTo,
                mailList,
            });
            await newEmailList.save();

            res.status(200).json({ message: "Email successfully sent" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllEmailSettings: async (req, res) => {
        try {
            const emailSettings = await EmailSettings.find({}).sort({
                createdAt: -1,
            });

            res.status(200).json(emailSettings);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllSentEmailsList: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const emails = await EmailSendList.find({})
                .sort({
                    createdAt: -1,
                })
                .limit(limit)
                .skip(limit * skip);

            const totalEmails = await EmailSendList.count();

            res.status(200).json({
                emails,
                skip: Number(skip),
                limit: Number(limit),
                totalEmails,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
