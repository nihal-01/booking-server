const { Schema, model } = require("mongoose");

const countrySchema = new Schema(
    {
        countryName: {
            type: String,
            required: true,
            lowercase: true,
        },
        isocode: {
            type: String,
            uppercase: true,
            required: true,
            unique: true,
        },
        phonecode: {
            type: String,
            required: true,
        },
        flag: {
            type: String,
            required: true,
        },
        currency: {
            type: String,
        },
        currencySymbol: {
            type: String,
            uppercase: true,
            required: true,
        },
    },
    { timestamps: true }
);

const Country = model("Country", countrySchema);

module.exports = Country;
