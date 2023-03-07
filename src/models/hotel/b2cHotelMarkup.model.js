const { Schema, model } = require("mongoose");

const b2cHotelMarkupSchema = new Schema(
    {
        hotel: {
            type: Schema.Types.ObjectId,
            ref: "Hotel",
            required: true,
        },
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
    },
    { timestamps: true }
);

const B2cHotelMarkup = model("B2cHotelMarkup", b2cHotelMarkupSchema);

module.exports = B2cHotelMarkup;
