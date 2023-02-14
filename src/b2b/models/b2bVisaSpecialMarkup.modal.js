const { Schema, model } = require("mongoose");

const b2bVisaSpecialMarkupSchema = new Schema(
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

const B2BSpecialVisaMarkup = model(
  "B2bSpecialVisaMarkup",
  b2bVisaSpecialMarkupSchema
);

module.exports = B2BSpecialVisaMarkup;
