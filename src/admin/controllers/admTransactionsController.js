const { isValidObjectId, Types } = require("mongoose");
const { B2BTransaction } = require("../../b2b/models");
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

    getAllB2bTransactions: async (req, res) => {
        try {
            const { skip = 0, limit = 10, b2bRole } = req.query;

            const filters2 = {};

            if (b2bRole && b2bRole !== "") {
                filters2["reseller.role"] = b2bRole;
            }

            const transactions = await B2BTransaction.aggregate([
                { $match: {} },
                {
                    $lookup: {
                        from: "resellers",
                        localField: "reseller",
                        foreignField: "_id",
                        as: "reseller",
                    },
                },
                {
                    $addFields: {
                        reseller: { $arrayElemAt: ["$reseller", 0] },
                    },
                },
                {
                    $match: filters2,
                },
                {
                    $project: {
                        reseller: {
                            companyName: 1,
                            website: 1,
                        },
                        transactionType: 1,
                        paymentProcessor: 1,
                        amount: 1,
                        status: 1,
                        createdAt: 1,
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $group: {
                        _id: null,
                        totalTransactions: { $sum: 1 },
                        data: { $push: "$$ROOT" },
                    },
                },
                {
                    $project: {
                        totalTransactions: 1,
                        data: {
                            $slice: [
                                "$data",
                                Number(limit) * Number(skip),
                                Number(limit),
                            ],
                        },
                    },
                },
            ]);

            res.status(200).json({
                result: transactions[0],
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleResellerTransactions: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;
            const { resellerId } = req.params;

            if (!isValidObjectId(resellerId)) {
                return sendErrorResponse(res, 400, "invalid reseller id");
            }

            const transactions = await B2BTransaction.aggregate([
                { $match: { reseller: Types.ObjectId(resellerId) } },
                {
                    $lookup: {
                        from: "resellers",
                        localField: "reseller",
                        foreignField: "_id",
                        as: "reseller",
                    },
                },
                {
                    $addFields: {
                        reseller: { $arrayElemAt: ["$reseller", 0] },
                    },
                },
                {
                    $project: {
                        reseller: {
                            companyName: 1,
                            website: 1,
                        },
                        transactionType: 1,
                        paymentProcessor: 1,
                        amount: 1,
                        status: 1,
                        createdAt: 1,
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $group: {
                        _id: null,
                        totalTransactions: { $sum: 1 },
                        data: { $push: "$$ROOT" },
                    },
                },
                {
                    $project: {
                        totalTransactions: 1,
                        data: {
                            $slice: [
                                "$data",
                                Number(limit) * Number(skip),
                                Number(limit),
                            ],
                        },
                    },
                },
            ]);

            res.status(200).json({
                result: transactions[0],
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
