const { Schema, model } = require("mongoose");

const currencySchema = new Schema(
    {
        country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: true,
            unique: true,
        },
        currencyName: {
            type: String,
            required: true,
        },
        currencySymbol: {
            type: String,
            required: true,
        },
        isocode: {
            type: String,
            uppercase: true,
            required: true,
        },
        conversionRate: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const Currency = model("Currency", currencySchema);

module.exports = Currency;
