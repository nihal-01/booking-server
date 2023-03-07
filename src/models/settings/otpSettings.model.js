const { Schema, model } = require("mongoose");

const otpSettingsSchema = new Schema(
    {
        twilioSID: {
            type: String,
            required: true,
        },
        twilioAuthToken: {
            type: String,
            required: true,
        },
        refNo: {
            type: Number,
            required: true,
            default: 1,
            unique: 1,
        },
    },
    { timestamps: true }
);

const OTPSettings = model("OTPSettings", otpSettingsSchema);

module.exports = OTPSettings;
