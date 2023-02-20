const { Schema, model } = require("mongoose");

const b2bBankDetailsSchema = new Schema(
  {
    bankName: {
      type: String,
      required: true,
    },
    bankCountry: {
      type: String,
      enum: ["India", "United Arab Emirates"],
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
      required: function () {
        return this.bankCountry === "India";
      },
    },
    ibanCode: {
      type: String,
      required: function () {
        return this.bankCountry === "United Arab Emirates";
      },
    }
    
  },
  { timestamps: true }
);

const B2BBankDetails = model("B2BBankDetails", b2bBankDetailsSchema);

module.exports = B2BBankDetails;
