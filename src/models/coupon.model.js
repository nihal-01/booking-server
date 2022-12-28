const { Schema, model } = require("mongoose");

const couponSchema = new Schema(
    {
        couponCode: {
            type: String,
            uppercase: true,
            unique: true,
            required: true,
        },
        amountType: {
            type: String,
            lowercase: true,
            required: true,
            enum: ["flat", "percentage"],
        },
        amount: {
            type: Number,
            required: true,
        },
        validFrom: {
            type: Date,
        },
        validTill: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        totalUses: {
            type: Number,
            required: true,
            default: 0,
        },
        isMaximumLimit: {
            type: Boolean,
            required: true,
        },
        maximumLimit: {
            type: Number,
            required: function () {
                return this.isMaximumLimit === true;
            },
        },
        couponFor: {
            type: [
                {
                    type: String,
                    lowercase: true,
                    required: true,
                    enum: ["attraction", "visa"],
                },
            ],
        },
    },
    { timestamps: true }
);

const Coupon = model("Coupon", couponSchema);

module.exports = Coupon;
