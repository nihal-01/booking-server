const { isValidObjectId } = require("mongoose");
const xl = require("excel4node");

const { sendErrorResponse } = require("../../helpers");
const { B2CTransaction } = require("../../models");
const {
    getB2bTransactions,
    generateB2bTransactionsSheet,
} = require("../../b2b/helpers/b2bTransactionsHelpers");

module.exports = {
    getAllB2cTransactions: async (req, res) => {
        try {
            const {
                skip = 0,
                limit = 10,
                transactionNo,
                transactionType,
                paymentProcessor,
                status,
                dateFrom,
                dateTo,
            } = req.query;

            const filters1 = {};
            const filters2 = {};

            if (transactionNo && transactionNo !== "") {
                filters1.transactionNo = Number(transactionNo);
            }

            if (transactionType && transactionType !== "") {
                filters1.transactionType = transactionType;
            }

            if (paymentProcessor && paymentProcessor !== "") {
                filters1.paymentProcessor = paymentProcessor;
            }

            if (status && status !== "") {
                filters1.status = status;
            }

            if (dateFrom && dateFrom !== "" && dateTo && dateTo !== "") {
                filters1.$and = [
                    { createdAt: { $gte: new Date(dateFrom) } },
                    { createdAt: { $lte: new Date(dateTo) } },
                ];
            } else if (dateFrom && dateFrom !== "") {
                filters1["createdAt"] = { $gte: new Date(dateFrom) };
            } else if (dateTo && dateTo !== "") {
                filters1["createdAt"] = { $lte: new Date(dateTo) };
            }

            const transactions = await B2CTransaction.aggregate([
                { $match: filters1 },
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $addFields: {
                        user: { $arrayElemAt: ["$user", 0] },
                    },
                },
                {
                    $match: filters2,
                },
                {
                    $project: {
                        user: {
                            name: 1,
                            email: 1,
                        },
                        transactionType: 1,
                        paymentProcessor: 1,
                        amount: 1,
                        status: 1,
                        createdAt: 1,
                        referenceNo: 1,
                        b2cTransactionNo: 1,
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

    getAllB2cTransactionsSheet: async (req, res) => {
        try {
            const {
                skip = 0,
                limit = 10,
                transactionNo,
                transactionType,
                paymentProcessor,
                status,
                dateFrom,
                dateTo,
            } = req.query;

            const filters1 = {};
            const filters2 = {};

            if (transactionNo && transactionNo !== "") {
                filters1.transactionNo = Number(transactionNo);
            }

            if (transactionType && transactionType !== "") {
                filters1.transactionType = transactionType;
            }

            if (paymentProcessor && paymentProcessor !== "") {
                filters1.paymentProcessor = paymentProcessor;
            }

            if (status && status !== "") {
                filters1.status = status;
            }

            if (dateFrom && dateFrom !== "" && dateTo && dateTo !== "") {
                filters1.$and = [
                    { createdAt: { $gte: new Date(dateFrom) } },
                    { createdAt: { $lte: new Date(dateTo) } },
                ];
            } else if (dateFrom && dateFrom !== "") {
                filters1["createdAt"] = { $gte: new Date(dateFrom) };
            } else if (dateTo && dateTo !== "") {
                filters1["createdAt"] = { $lte: new Date(dateTo) };
            }

            const transactions = await B2CTransaction.aggregate([
                { $match: filters1 },
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $addFields: {
                        user: { $arrayElemAt: ["$user", 0] },
                    },
                },
                {
                    $match: filters2,
                },
                {
                    $project: {
                        user: {
                            name: 1,
                            email: 1,
                        },
                        transactionType: 1,
                        paymentProcessor: 1,
                        amount: 1,
                        status: 1,
                        createdAt: 1,
                        referenceNo: 1,
                        b2cTransactionNo: 1,
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $skip: Number(limit) * Number(skip),
                },
                {
                    $limit: Number(limit),
                },
            ]);

            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Orders");

            const titleStyle = wb.createStyle({
                font: {
                    bold: true,
                },
            });

            ws.cell(1, 1).string("Transaction No").style(titleStyle);
            ws.cell(1, 2).string("User Name").style(titleStyle);
            ws.cell(1, 3).string("User Email").style(titleStyle);
            ws.cell(1, 4).string("Date").style(titleStyle);
            ws.cell(1, 5).string("Transaction Type").style(titleStyle);
            ws.cell(1, 6).string("Payment Processor").style(titleStyle);
            ws.cell(1, 7).string("Amount").style(titleStyle);
            ws.cell(1, 8).string("Status").style(titleStyle);

            for (let i = 0; i < transactions?.length; i++) {
                const transaction = transactions[i];

                ws.cell(i + 2, 1).number(
                    Number(transaction?.b2cTransactionNo) || 0
                );
                ws.cell(i + 2, 2).string(transaction?.user?.name || "N/A");
                ws.cell(i + 2, 3).string(transaction?.user?.email || "N/A");
                ws.cell(i + 2, 4).string(
                    new Date(transaction?.createdAt)?.toDateString() || "N/A"
                );
                ws.cell(i + 2, 5).string(transaction?.transactionType || "N/A");
                ws.cell(i + 2, 6).string(
                    transaction?.paymentProcessor || "N/A"
                );
                ws.cell(i + 2, 7).number(Number(transaction?.amount) || 0);
                ws.cell(i + 2, 8).string(transaction?.status || "N/A");
            }

            wb.write(`FileName.xlsx`, res);
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
