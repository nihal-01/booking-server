const { Schema, model } = require("mongoose");

const b2bTransactionSchema = new Schema(
    {
        reseller: {
            type: Schema.Types.ObjectId,
            ref: "Reseller",
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
            enum: ["paypal", "stripe", "razorpay"],
        },
        paymentId: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentDetails: {},
    },
    { timestamps: true }
);

const B2BTransaction = model("B2BTransaction", b2bTransactionSchema);

module.exports = B2BTransaction;
