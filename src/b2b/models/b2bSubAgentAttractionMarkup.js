const { Schema, model } = require("mongoose");

const b2bSubAgentAttractionMarkupSchema = new Schema(
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
        attraction: {
            type: Schema.Types.ObjectId,
            ref: "Attraction",
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

const B2BSubAgentAttractionMarkup = model(
    "B2BSubAgentAttractionMarkup",
    b2bSubAgentAttractionMarkupSchema
);

module.exports = B2BSubAgentAttractionMarkup;
