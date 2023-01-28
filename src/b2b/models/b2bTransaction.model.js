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
            enum: ["deposit", "withdraw", "deduct", "refund", "markup"],
        },
        paymentProcessor: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["paypal", "stripe", "razorpay", "wallet"],
        },
        amount: {
            type: Number,
            required: true,
        },
        isPendingExpiry: {
            type: Boolean,
            required: true,
            default: false,
        },
        pendingExpiry: {
            type: Date,
            required: function () {
                return this.isPendingExpiry === true;
            },
        },
        order: {
            type: Schema.Types.ObjectId,
            required: function () {
                return this.paymentProcessor === "wallet";
            },
        },
        orderItem: {
            type: Schema.Types.ObjectId,
            required: function () {
                return this.transactionType === "markup";
            },
        },
        paymentDetails: {},
        status: {
            type: String,
            lowercase: true,
            enum: ["pending", "success", "failed", "cancelled"],
            required: true,
        },
        paymentOrderId: {
            type: String,
        },
    },
    { timestamps: true }
);

const B2BTransaction = model("B2BTransaction", b2bTransactionSchema);

module.exports = B2BTransaction;
