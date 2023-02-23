const { sendErrorResponse } = require("../../helpers");
const { B2BTransaction, B2BWallet } = require("../models");
const {
    getB2bTransactions,
    generateB2bTransactionsSheet,
} = require("../helpers/b2bTransactionsHelpers");

module.exports = {
    getSingleB2bAllTransactions: async (req, res) => {
        try {
            const { result, skip, limit } = await getB2bTransactions({
                ...req.query,
                resellerId: req.reseller?._id,
                b2bRole: "",
                agentCode: "",
            });

            res.status(200).json({ result, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleB2bAllTransactionsSheet: async (req, res) => {
        try {
            await generateB2bTransactionsSheet({
                ...req.query,
                res,
                resellerId: req.reseller?._id,
                b2bRole: "",
                agentCode: "",
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

    getSingleSubAgentTransation: async (req, res) => {
        try {
             const {resellerId} = req.params
            const { result, skip, limit } = await getB2bTransactions({
                ...req.query,
                resellerId: resellerId,
                b2bRole: "",
                agentCode: "",
            });

            res.status(200).json({ result, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
