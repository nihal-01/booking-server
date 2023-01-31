const { B2BTransaction, B2BWallet } = require("../models");

module.exports = {
    handleAttractionOrderMarkup: async (orderId, orderItem) => {
        try {
            for (let i = 0; i < orderItem?.markups?.length; i++) {
                if (orderItem?.markups[i].amount > 0) {
                    if (orderItem?.markups[i].isExpiry === false) {
                        const transaction = new B2BTransaction({
                            reseller: orderItem?.markups[i].to,
                            transactionType: "markup",
                            paymentProcessor: "wallet",
                            status: "pending",
                            amount: orderItem?.markups[i].amount,
                            isPendingExpiry: false,
                            order: orderId,
                            orderItem: orderItem?._id,
                        });

                        let wallet = await B2BWallet.findOne({
                            reseller: orderItem?.markups[i].to,
                        });
                        if (!wallet) {
                            wallet = new B2BWallet({
                                balance: 0,
                                reseller: orderItem?.markups[i].to,
                            });
                        }

                        wallet.balance += orderItem?.markups[i].amount;
                        await wallet.save();
                        transaction.status = "success";
                        await transaction.save();
                    } else {
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

                        await transaction.save();
                    }
                }
            }
        } catch (err) {
            throw err;
        }
    },
};
