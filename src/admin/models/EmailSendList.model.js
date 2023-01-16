const { Schema, model } = require("mongoose");

const emailSendListSchema = new Schema(
    {
        sentFrom: {
            type: String,
            required: true,
        },
        emailType: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        html: {
            type: String,
            required: true,
        },
        sentTo: {
            type: String,
            required: true,
        },
        mailList: {
            type: [{ type: String }],
        },
    },
    { timestamps: true }
);

const EmailSendList = model("EmailSendList", emailSendListSchema);

module.exports = EmailSendList;
