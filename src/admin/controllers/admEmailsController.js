const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Email } = require("../models");
const {
    emailSchema,
    sendEmailSchema,
} = require("../validations/admEmails.schema");

module.exports = {
    addNewMail: async (req, res) => {
        try {
            const { email, emailType } = req.body;

            const { _, error } = emailSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const prevEmail = await Email.findOne({ emailType });
            if (prevEmail) {
                return sendErrorResponse(
                    res,
                    400,
                    "An email already added with this type"
                );
            }

            const newEmail = new Email({
                email,
                emailType,
            });
            await newEmail.save();

            res.status(200).json(newEmail);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateEmail: async (req, res) => {
        try {
            const { id } = req.params;
            const { email, emailType } = req.body;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid email settings id");
            }

            const { _, error } = emailSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const prevEmailDetails = await Email.findOne({
                _id: { $ne: id },
                emailType: emailType?.toLowerCase(),
            });
            if (prevEmailDetails) {
                return sendErrorResponse(
                    res,
                    400,
                    "An email already added with this type"
                );
            }

            const emailDetails = await Email.findByIdAndUpdate(
                id,
                {
                    email,
                    emailType,
                },
                { runValidators: true, new: true }
            );
            if (!emailDetails) {
                return sendErrorResponse(res, 404, "Email settings not found");
            }

            res.status(200).json(emailDetails);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteEmail: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid email id");
            }

            const emailDetails = await Email.findByIdAndDelete(id);
            if (!emailDetails) {
                return sendErrorResponse(res, 400, "Email not found");
            }

            res.status(200).json({
                message: "Email successfully deleted",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    sendMail: async (req, res) => {
        try {
            const { subject, html, emailType, sendTo } = req.body;

            const { _, error } = sendEmailSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            // const emailSettings = await EmailSettings.findOne({
            //     emailType: emailType?.toLowerCase(),
            // });
            // if (!emailSettings) {
            //     return sendErrorResponse(res, 404, "Email settings not found");
            // }

            // let mailList = [];
            // if (sendTo === "subscribers") {
            //     mailList = await Subscriber.find({
            //         subscribed: true,
            //     }).distinct("email");
            // } else if (sendTo === "b2b") {
            //     mailList = await Reseller.find({ status: "ok" }).distinct(
            //         "email"
            //     );
            // } else if (sendTo === "b2c") {
            //     mailList = await User.distinct("email");
            // }

            // await sendCustomEmail({
            //     senderEmail: emailSettings.email,
            //     senderPassword: emailSettings.password,
            //     subject,
            //     html,
            //     mailList,
            // });

            // const newEmailList = new EmailSendList({
            //     sentFrom: emailSettings.email,
            //     subject,
            //     html,
            //     emailType,
            //     sentTo: sendTo,
            //     mailList,
            // });
            // await newEmailList.save();

            res.status(200).json({ message: "Email successfully sent" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllEmails: async (req, res) => {
        try {
            const emails = await Email.find({}).sort({
                createdAt: -1,
            });

            res.status(200).json(emails);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
