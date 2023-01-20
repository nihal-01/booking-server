const { Schema, model } = require("mongoose");

const emailSchema = new Schema(
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
            enum: ["promotion", "support"],
        },
    },
    { timestamps: true }
);

const Email = model("Email", emailSchema);

module.exports = Email;
