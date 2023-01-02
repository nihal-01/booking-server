const { Schema, model } = require("mongoose");

const paymentSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        paymentId: {
            type: String,
            required: true,
        },
        orderId: {
            type: String,
            required: true,
        },
        orderType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["attraction", "visa"],
        },
        order: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        paymentDetails: {},
        merchant: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["paypal"],
        },
    },
    { timestamps: true }
);

const Payment = model("Payment", paymentSchema);

module.exports = Payment;
