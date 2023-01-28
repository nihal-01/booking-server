const { Schema, model } = require("mongoose");

const b2bClientAttractionMarkupSchema = new Schema(
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

const B2BClientAttractionMarkup = model(
    "B2BClientAttractionMarkup",
    b2bClientAttractionMarkupSchema
);

module.exports = B2BClientAttractionMarkup;
