const { sendErrorResponse } = require("../../helpers");
const { B2BTransaction } = require("../models");

module.exports = {
    getB2BTransactions: async (req, res) => {
        try {
            const { skip = 0, limit = 10 , status } = req.query;

            
            let query = { reseller: req.reseller._id };

            if (status !== "all") {
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
};