const { Schema, model } = require("mongoose");

const emailServiceSchema = new Schema(
    {
        serviceProvider: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["twilio"],
        },
        apiKey: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const EmailService = model("EmailService", emailServiceSchema);

module.exports = EmailService;
