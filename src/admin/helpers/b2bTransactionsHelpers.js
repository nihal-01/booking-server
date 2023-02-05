const xl = require("excel4node");
const { Types } = require("mongoose");

const { B2BTransaction } = require("../../b2b/models");

module.exports = {
    getB2bTransactions: async ({
        skip = 0,
        limit = 10,
        b2bRole,
        transactionNo,
        transactionType,
        paymentProcessor,
        status,
        dateFrom,
        dateTo,
        resellerId,
        agentCode,
    }) => {
        try {
            const filters1 = {};
            const filters2 = {};

            if (resellerId && resellerId !== "") {
                filters1.reseller = Types.ObjectId(resellerId);
            }

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

            if (b2bRole && b2bRole !== "") {
                filters2["reseller.role"] = b2bRole;
            }

            if (agentCode && agentCode !== "") {
                filters2["reseller.agentCode"] = Number(agentCode);
            }

            const transactions = await B2BTransaction.aggregate([
                { $match: filters1 },
                {
                    $lookup: {
                        from: "resellers",
                        localField: "reseller",
                        foreignField: "_id",
                        as: "reseller",
                    },
                },
                {
                    $lookup: {
                        from: "admins",
                        localField: "depositor",
                        foreignField: "_id",
                        as: "depositor",
                    },
                },
                {
                    $addFields: {
                        reseller: { $arrayElemAt: ["$reseller", 0] },
                        depositor: { $arrayElemAt: ["$depositor", 0] },
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
                            name: 1,
                        },
                        transactionType: 1,
                        paymentProcessor: 1,
                        amount: 1,
                        status: 1,
                        createdAt: 1,
                        depositor: {
                            name: 1,
                        },
                        referenceNo: 1,
                        transactionNo: 1,
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

            return {
                result: transactions[0],
                skip: Number(skip),
                limit: Number(limit),
            };
        } catch (err) {
            throw err;
        }
    },

    generateB2bTransactionsSheet: async ({
        skip = 0,
        limit = 10,
        b2bRole,
        transactionNo,
        transactionType,
        paymentProcessor,
        status,
        dateFrom,
        dateTo,
        resellerId,
        res,
        agentCode,
    }) => {
        try {
            const filters1 = {};
            const filters2 = {};

            if (resellerId && resellerId !== "") {
                filters1.reseller = Types.ObjectId(resellerId);
            }

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
                filters1["createdAt"] = { $lte: new Date(dateFrom) };
            } else if (dateTo && dateTo !== "") {
                filters1["createdAt"] = { $lte: new Date(dateTo) };
            }

            if (b2bRole && b2bRole !== "") {
                filters2["reseller.role"] = b2bRole;
            }

            if (agentCode && agentCode !== "") {
                filters2["reseller.agentCode"] = Number(agentCode);
            }

            const transactions = await B2BTransaction.aggregate([
                { $match: filters1 },
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
                            email: 1,
                        },
                        transactionType: 1,
                        paymentProcessor: 1,
                        amount: 1,
                        status: 1,
                        createdAt: 1,
                        transactionNo: 1,
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
            ws.cell(1, 2).string("Reseller").style(titleStyle);
            ws.cell(1, 3).string("Reseller Email").style(titleStyle);
            ws.cell(1, 4).string("Date").style(titleStyle);
            ws.cell(1, 5).string("Transaction Type").style(titleStyle);
            ws.cell(1, 6).string("Payment Processor").style(titleStyle);
            ws.cell(1, 7).string("Amount").style(titleStyle);
            ws.cell(1, 8).string("Status").style(titleStyle);

            for (let i = 0; i < transactions?.length; i++) {
                const transaction = transactions[i];

                ws.cell(i + 2, 1).number(
                    Number(transaction?.transactionNo) || 0
                );
                ws.cell(i + 2, 2).string(
                    transaction?.reseller?.companyName || "N/A"
                );
                ws.cell(i + 2, 3).string(transaction?.reseller?.email);
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
            throw err;
        }
    },
};
