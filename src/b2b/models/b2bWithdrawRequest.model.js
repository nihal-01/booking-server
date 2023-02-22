const { Schema, model } = require("mongoose");

const b2bWalletWithdrawRequest = new Schema(
  {
    resellerId: {
      type: Schema.Types.ObjectId,
      ref: "Reseller",
      required: true,
    },
    bankDetailsId: {
      type: Schema.Types.ObjectId,
      ref: "B2BBankDetails",
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["initiated", "pending", "confirmed", "cancelled"],
    },
    otp: {
      type: Number,
      required: true,
    },
    referenceNo: {
      type: String,
      required : true
    },
  },
  { timestamps: true }
);

const B2BWalletWithdraw = model("B2BWalletWithdraw", b2bWalletWithdrawRequest);

module.exports = B2BWalletWithdraw;
