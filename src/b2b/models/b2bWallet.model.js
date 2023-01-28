const { Schema, model } = require("mongoose");

const b2bWalletSchema = new Schema(
    {
        balance: {
            type: Number,
            required: true,
            default: 0,
        },
        reseller: {
            type: Schema.Types.ObjectId,
            ref: "Reseller",
            required: true,
            unique: true,
        },
    },
    { timestamps: true }
);

const B2BWallet = model("B2BWallet", b2bWalletSchema);

module.exports = B2BWallet;
