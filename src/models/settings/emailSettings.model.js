const { Schema, model } = require("mongoose");

const emailSettingsSchema = new Schema(
    {
        emailService: {
            type: Schema.Types.ObjectId,
            ref: "EmailService",
            required: true,
        },
        sendOfferMails: {
            type: Boolean,
            required: true,
        },
        refNo: {
            type: Number,
            required: true,
            default: 1,
            unique: true,
        },
    },
    { timestamps: true }
);

const EmailSettings = model("EmailSettings", emailSettingsSchema);

module.exports = EmailSettings;
