const { Schema, model } = require("mongoose");

const b2bSpecialMarkupSchema = new Schema(
    {
        markup: {
            type: Number,
            required: true,
            default: 0,
        },
        markupType: {
            type: String,
            required: true,
            enum: ["flat", "percentage"]
        },
        resellerId: {
            type: Schema.Types.ObjectId,
            ref: "Reseller",
            required: true,
        },
    },
    { timestamps: true }
);

const SpecialMarkup = model("SpecialMarkup", b2bSpecialMarkupSchema);

module.exports = SpecialMarkup;
