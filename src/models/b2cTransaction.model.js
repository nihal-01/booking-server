const { Schema, model } = require("mongoose");

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

const B2CTransaction = model("B2CTransaction", b2cTransactionSchema);

module.exports = B2CTransaction;
