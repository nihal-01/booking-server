const { OtpSettings } = require("../models");

const getOtpSettings = async () => {
    try {
        const otpSettings = await OtpSettings.findOne({ refNo: 1 }).cache();
        return otpSettings;
    } catch (err) {
        throw err;
    }
};

module.exports = getOtpSettings;
