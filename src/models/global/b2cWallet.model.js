const { Schema, model } = require("mongoose");

const b2cWalletSchema = new Schema(
    {
        balance: {
            type: Number,
            required: true,
            default: 0,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
    },
    { timestamps: true }
);

const B2CWallet = model("B2CWallet", b2cWalletSchema);

module.exports = B2CWallet;
