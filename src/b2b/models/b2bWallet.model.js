const { Schema, model } = require("mongoose");

const b2bWalletSchema = new Schema(
    {
        balance: {
            type: Number,
            required: true,
            default: 0,
        },
        // pendingBalance: {
        //     type: [
        //         {
        //             amount: {
        //                 type: Number,
        //                 required: true,
        //             },
        //             transactionId: {
        //                 type: Schema.Types.ObjectId,
        //                 ref: "B2BTransaction",
        //                 required: true,
        //             },
        //             expiresIn: {
        //                 type: Date,
        //                 required: true,
        //             },
        //         },
        //     ],
        //     default: [],
        // },
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
