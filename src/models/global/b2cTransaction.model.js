const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AutoIncrement = require("mongoose-sequence")(mongoose);

const b2cTransactionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        transactionType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["deposit", "withdraw", "deduct", "refund"],
        },
        status: {
            type: String,
            lowercase: true,
            enum: ["pending", "success", "failed"],
            required: true,
        },
        paymentProcessor: {
            type: String,
            required: true,
            lowercase: true,
            enum: [
                "paypal",
                "stripe",
                "razorpay",
                "wallet",
                "ccavenue",
                "bank",
            ],
        },
        paymentId: {
            type: String,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "AttractionOrder",
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentDetails: {},
        b2cTransactionNo: {
            type: Number,
        },
    },
    { timestamps: true }
);

b2cTransactionSchema.plugin(AutoIncrement, {
    inc_field: "b2cTransactionNo",
    start_seq: 10000,
});

const B2CTransaction = model("B2CTransaction", b2cTransactionSchema);

module.exports = B2CTransaction;
