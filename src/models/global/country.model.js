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
        },
        phonecode: {
            type: String,
            required: true,
        },
        flag: {
            type: String,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

const Country = model("Country", countrySchema);

module.exports = Country;
