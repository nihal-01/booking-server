const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { EmailSettings } = require("../models");

module.exports = {
    updateEmailSettings: async (req, res) => {
        try {
            const { emailService, sendOfferMails } = req.body;

            if (!isValidObjectId(emailService)) {
                return sendErrorResponse(res, 400, "Invalid email service id");
            }

            const emailSettings = await EmailSettings.findOneAndUpdate(
                {
                    refNo: 1,
                },
                {
                    emailService,
                    sendOfferMails,
                },
                { runValidators: true, new: true, upsert: true }
            );

            res.status(200).json(emailSettings);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getEmailSettings: async (req, res) => {
        try {
            const emailSettings = await EmailSettings.findOne({ refNo: 1 });
            res.status(200).json(emailSettings);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
