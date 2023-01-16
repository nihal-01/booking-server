const { Schema, model } = require("mongoose");

const b2cWalletSchema = new Schema(
    {
        balance: {
            type: Number,
            required: true,
            default: 0,
        },
        pendingBalance: {
            type: [
                {
                    amount: {
                        type: Number,
                        required: true,
                    },
                    orderId: {
                        type: Number,
                        required: true,
                    },
                    orderType: {
                        type: String,
                        required: true,
                    },
                    expiresIn: {
                        type: Date,
                        required: true,
                    },
                },
            ],
            default: [],
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

module.exports = { B2CWallet };
