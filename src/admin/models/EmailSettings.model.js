const { Schema, model } = require("mongoose");

const emailSettingsSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
        },
        emailType: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const EmailSettings = model("EmailSettings", emailSettingsSchema);

module.exports = EmailSettings;
