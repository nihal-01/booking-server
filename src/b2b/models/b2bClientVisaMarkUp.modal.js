const { Schema, model } = require("mongoose");

const b2bClientVisaMarkupSchema = new Schema(
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
            ref: "visaType",
            required: true,
        },
        resellerId : {
            type: Schema.Types.ObjectId,
            ref: "Reseller",
            required: true,
        },
    },
    { timestamps: true }
);

const B2BClientVisaMarkup = model(
    "B2BClientVisaMarkup",
    b2bClientVisaMarkupSchema
);

module.exports = B2BClientVisaMarkup;
