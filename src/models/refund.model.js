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
            type: String,
            required: true,
        },
        // orderedBy: {
        //   type: String,
        //   enum: ["b2c", "b2b", "sub-agent"],
        //   required: true,
        // },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            // required: function () {
            //   return this.orderedBy === "b2c";
            // },
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
    },
    { timestamps: true }
);

const Refund = model("Refund", refundSchema);

module.exports = Refund;
