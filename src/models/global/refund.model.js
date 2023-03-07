const { Schema, model } = require("mongoose");

const refundSchema = new Schema(
    {
        category: {
            type: String,
            lowercase: true,
            enum: ["visa", "flight", "attraction"],
            required: true,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "AttractionOrder",
            required: function () {
                return this.category === "attraction";
            },
        },
        activityId: {
            type: Schema.Types.ObjectId,
            required: function () {
                return this.category === "attraction";
            },
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        amount: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["success", "pending", "failed"],
            reuired: true,
        },
        bankDetails: {
            type: Schema.Types.ObjectId,
            ref: "B2CBankDetails",
            required: true,
        },
        reason: {
            type: String,
        },
        paymentReferenceNumber: {
            type: String,
        },
    },
    { timestamps: true }
);

const Refund = model("Refund", refundSchema);

module.exports = Refund;
