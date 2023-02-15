const { Schema, model } = require("mongoose");

const b2bAttractionSpecialMarkupSchema = new Schema(
    {
        resellerId: {
            type: Schema.Types.ObjectId,
            ref: "Reseller",
            required: true,
        },
        markup: {
            type: Number,
            required: true,
            default: 0,
        },
        markupType: {
            type: String,
            required: true,
            enum: ["flat", "percentage"],
        },
    },
    { timestamps: true }
);

const B2BSpecialAttractionMarkup = model(
    "B2BSpecialAttractionMarkup",
    b2bAttractionSpecialMarkupSchema
);

module.exports = B2BSpecialAttractionMarkup;
