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
            default: 0,
        },
        resellerId: {
            type: String,
            required: true,
            // type: Schema.Types.ObjectId,
            // ref: "Reseller",
        },
    },
    { timestamps: true }
);

const SpecialMarkup = model("SpecialMarkup", b2bSpecialMarkupSchema);

module.exports = SpecialMarkup;
