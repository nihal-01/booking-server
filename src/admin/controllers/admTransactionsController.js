const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { B2CTransaction } = require("../../models");
const {
    getB2bTransactions,
    generateB2bTransactionsSheet,
} = require("../../b2b/helpers/b2bTransactionsHelpers");

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

    getAllB2bTransactions: async (req, res) => {
        try {
            const { result, skip, limit } = await getB2bTransactions({
                ...req.query,
            });

            res.status(200).json({ result, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleResellerTransactions: async (req, res) => {
        try {
            const { resellerId } = req.params;

            if (!isValidObjectId(resellerId)) {
                return sendErrorResponse(res, 400, "invalid reseller id");
            }

            const { result, skip, limit } = await getB2bTransactions({
                ...req.query,
                resellerId,
            });

            res.status(200).json({ result, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getB2bTransactionsSheet: async (req, res) => {
        try {
            await generateB2bTransactionsSheet({ ...req.query, res });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleResellerTransactionsSheet: async (req, res) => {
        try {
            const { resellerId } = req.params;

            if (!isValidObjectId(resellerId)) {
                return sendErrorResponse(res, 400, "invalid reseller id");
            }

            await generateB2bTransactionsSheet({
                ...req.query,
                resellerId,
                res,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
