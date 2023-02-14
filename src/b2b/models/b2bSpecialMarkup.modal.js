const { Schema, model } = require("mongoose");

const b2bSpecialMarkupSchema = new Schema(
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

const SpecialMarkup = model(
  "B2BSpecialAttractionMarkup",
  b2bSpecialMarkupSchema
);

module.exports = SpecialMarkup;
