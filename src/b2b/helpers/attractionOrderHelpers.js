const { B2BTransaction } = require("../models");

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

                await transaction.save();
            }
        } catch (err) {
            throw err;
        }
    },
};
