const { Schema, model } = require("mongoose");

const transactionSchema = new Schema(
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
        // lastBalance: {
        //     type: Number,
        //     required: true,
        // },
        amount: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const Transaction = model("Transaction", transactionSchema);

module.exports = Transaction;
