const { OtpSettings } = require("../models");

const getOtpSettings = async () => {
    try {
        const otpSettings = await OtpSettings.findOne({ refNo: 1 }).cache();
        return otpSettings, null;
    } catch (err) {
        return null, err;
    }
};

module.exports = getOtpSettings;
