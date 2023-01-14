const { Schema, model } = require("mongoose");

const transactionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        userType : {
            type: String,
            required: true,
            lowercase: true,
            enum: ["b2b"], 
        },
        transactionType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["deposit", "withdraw", "deduct", "refund"],
        },
        status:{
            type : "String",
            default : "true"

        },
        paymentProcessor: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["paypal", "stripe"],
        },
        paymentId : {
            type: String
        },
        processStatus: {
            type :String
        },    
        amount: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const Transaction = model("Transaction", transactionSchema);

module.exports = Transaction;
