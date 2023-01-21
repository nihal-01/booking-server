const { sendErrorResponse } = require("../../helpers");
const { OtpSettings } = require("../../models");

module.exports = {
    updateOtpSettings: async (req, res) => {
        try {
            const { twilioSID, twilioAuthToken } = req.body;

            const otpSettings = await OtpSettings.findOneAndUpdate(
                { refNo: 1 },
                {
                    twilioSID,
                    twilioAuthToken,
                },
                { runValidators: true, new: true, upsert: true }
            );

            res.status(200).json(otpSettings);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getOtpSettings: async (req, res) => {
        try {
            const otpSettings = await OtpSettings.findOne({ refNo: 1 });
            res.status(200).json(otpSettings);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
