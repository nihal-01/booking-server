const { B2BTransaction, B2BWallet } = require("../models");

module.exports = {
    handleAttractionOrderMarkup: async (orderId, orderItem) => {
        try {
            for (let i = 0; i < orderItem?.markups?.length; i++) {
                const transaction = new B2BTransaction({
                    reseller: orderItem?.markups[i].to,
                    transactionType: "markup",
                    paymentProcessor: "wallet",
                    status: "pending",
                    amount: orderItem?.markups[i].amount,
                    isPendingExpiry: true,
                    pendingExpiry: orderItem.date,
                    order: orderId,
                    orderItem: orderItem?._id,
                });

                // let wallet;
                // wallet = await B2BWallet.findOne({ reseller: orderItem?.markups[i].to });
                // if (!wallet) {
                //     wallet = new B2BWallet({
                //         balance: 0,
                //         pendingBalance: [],
                //         reseller,
                //     });
                // }

                // if (wallet.pendingBalance) {
                //     wallet.pendingBalance?.push({
                //         amount: orderItem?.markups[i].amount,
                //         transactionId: transaction?._id,
                //         expiresIn: orderItem.date,
                //     });
                // } else {
                //     wallet.pendingBalance = [
                //         {
                //             amount: orderItem?.markups[i].amount,
                //             transactionId: transaction?._id,
                //             expiresIn: orderItem.date,
                //         },
                //     ];
                // }

                await transaction.save();
                // await wallet.save();
            }
        } catch (err) {
            throw err;
        }
    },
};
