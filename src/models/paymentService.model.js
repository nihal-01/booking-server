const { Schema, model } = require("mongoose");

const paymentServiceSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        paymentProcessor: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["razorpay", "paypal", "stripe"],
            unique: true,
        },
        clientId: {
            type: String,
            required: true,
        },
        clientSecret: {
            type: String,
            required: true,
        },
        processingFee: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const PaymentService = model("PaymentService", paymentServiceSchema);

module.exports = PaymentService;
