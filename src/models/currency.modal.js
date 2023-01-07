const { Schema, model } = require("mongoose");

const currencySchema = new Schema(
    {
        country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: true,
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
