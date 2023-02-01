const { sendErrorResponse } = require("../../helpers");
const { B2BTransaction, B2BWallet } = require("../models");

module.exports = {
    getB2BTransactions: async (req, res) => {
        try {
            const { skip = 0, limit = 10, status } = req.query;

            let query = { reseller: req.reseller._id };

            if (status && status !== "all") {
                query.status = status;
            }

            const transactions = await B2BTransaction.find(query)
                .sort({
                    createdAt: -1,
                })
                .limit(limit)
                .skip(limit * skip);

            const totalTransactions = await B2BTransaction.find(query).count();

            res.status(200).json({
                transactions,
                skip: Number(skip),
                limit: Number(limit),
                totalTransactions,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getB2bBalance: async (req, res) => {
        try {
            let wallet = await B2BWallet.findOne({
                reseller: req.reseller?._id,
            });

            if (!wallet) {
                wallet = new B2BWallet({
                    balance: 0,
                    reseller: req.reseller._id,
                });
            }

            const transactions = await B2BTransaction.find({
                reseller: req.reseller._id,
                isPendingExpiry: true,
                pendingExpiry: { $lt: new Date() },
                status: "pending",
                transactionType: "markup",
            }).lean();
            for (let i = 0; i < transactions.length; i++) {
                const transaction = await B2BTransaction.findOneAndUpdate(
                    {
                        _id: transactions[0]?._id,
                    },
                    {
                        status: "success",
                    }
                );
                wallet.balance += transaction.amount;
                await wallet.save();
            }

            const pendingBalance = await B2BTransaction.aggregate([
                {
                    $match: {
                        isPendingExpiry: true,
                        status: "pending",
                        reseller: req.reseller?._id,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$amount" },
                    },
                },
            ]);

            res.status(200).json({
                balance: wallet.balance,
                pendingBalance: pendingBalance[0]
                    ? pendingBalance[0].totalAmount
                    : 0,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
