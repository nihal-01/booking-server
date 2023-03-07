const { Schema, model } = require("mongoose");

const b2cVisaMarkupSchema = new Schema(
    {
        markupType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["flat", "percentage"],
        },
        markup: {
            type: Number,
            required: true,
        },
        visaType: {
            type: Schema.Types.ObjectId,
            ref: "VisaType",
            required: true,
        },
    },
    { timestamps: true }
);

const B2cClientVisaMarkup = model(
    "B2CClientVisaMarkup",
    b2cVisaMarkupSchema
);

module.exports = B2cClientVisaMarkup;
