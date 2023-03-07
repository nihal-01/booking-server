const { Schema, model } = require("mongoose");

const b2cBankDetailsSchema = new Schema(
    {
        bankName: {
            type: String,
            required: true,
        },
        bankCountry: {
            type: String,
            required: true,
        },
        countryId: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: true,
        },
        accountHolderName: {
            type: String,
            required: true,
        },
        accountNumber: {
            type: String,
            required: true,
        },
        ifscCode: {
            type: String,
        },
        ibanCode: {
            type: String,
        },
    },
    { timestamps: true }
);

const B2CBankDetails = model("B2CBankDetails", b2cBankDetailsSchema);

module.exports = B2CBankDetails;
