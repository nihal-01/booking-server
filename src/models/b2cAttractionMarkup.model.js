const { Schema, model } = require("mongoose");

const b2cAttractionMarkupSchema = new Schema(
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
        atttraction: {
            type: Schema.Types.ObjectId,
            ref: "Attraction",
            required: true,
        },
    },
    { timestamps: true }
);

const B2CAttractionMarkup = model(
    "B2CAttractionMarkup",
    b2cAttractionMarkupSchema
);

module.exports = B2CAttractionMarkup;
