const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AutoIncrement = require("mongoose-sequence")(mongoose);

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
            enum: [
                "paypal",
                "stripe",
                "razorpay",
                "wallet",
                "bank",
                "cash-in-hand",
            ],
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
            enum: ["pending", "success", "failed"],
            required: true,
        },
        paymentOrderId: {
            type: String,
        },
        transactionNo: {
            type: Number,
        },
        referenceNo: {
            type: String,
            required: function () {
                return this.paymentProcessor === "bank";
            },
        },
        depositor: {
            type: Schema.Types.ObjectId,
            ref: "Admin",
            required: function () {
                return (
                    this.paymentProcessor === "bank" ||
                    this.paymentProcessor === "cash-in-hand"
                );
            },
        },
    },
    { timestamps: true }
);

b2bTransactionSchema.plugin(AutoIncrement, {
    inc_field: "transactionNo",
    start_seq: 10000,
});

const B2BTransaction = model("B2BTransaction", b2bTransactionSchema);

module.exports = B2BTransaction;
