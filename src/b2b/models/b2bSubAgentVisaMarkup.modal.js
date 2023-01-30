const { Schema, model } = require("mongoose");


const b2bSubAgentVisaMarkupSchema = new Schema(
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

const B2BSubAgentVisaMarkup = model(
    "B2BSubAgentVisaMarkup",
    b2bSubAgentVisaMarkupSchema
);

module.exports = B2BSubAgentVisaMarkup;