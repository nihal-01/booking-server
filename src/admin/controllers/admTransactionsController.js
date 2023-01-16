const { sendErrorResponse } = require("../../helpers");
const { B2CTransaction } = require("../../models");

module.exports = {
    getAllB2cTransactions: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const transactions = await B2CTransaction.find({})
                .sort({
                    createdAt: -1,
                })
                .limit(limit)
                .skip(limit * skip);

            const totalTransactions = await B2CTransaction.find({}).count();

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
