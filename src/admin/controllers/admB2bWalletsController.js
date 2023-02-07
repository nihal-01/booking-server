const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Reseller, B2BTransaction, B2BWallet } = require("../../b2b/models");

module.exports = {
    addMoneyToB2bWallet: async (req, res) => {
        try {
            const { resellerId, amount, referenceNo, paymentProcessor } =
                req.body;

            if (!isValidObjectId(resellerId)) {
                return sendErrorResponse(res, 400, "invalid reseller id");
            }

            const reseller = await Reseller.findOne({
                _id: resellerId,
                $or: [{ status: "ok" }, { status: "disabled" }],
            });

            if (!reseller) {
                return sendErrorResponse(
                    res,
                    400,
                    "reseller not found or not active"
                );
            }

            if (Number(amount) <= 0) {
                return sendErrorResponse(
                    res,
                    400,
                    "amount should be greater than zero"
                );
            }

            const newTransaction = new B2BTransaction({
                reseller: resellerId,
                transactionType: "deposit",
                paymentProcessor,
                amount,
                status: "pending",
                referenceNo,
                depositor: req.admin?._id,
            });

            let wallet = await B2BWallet.findOne({ reseller: resellerId });
            if (!wallet) {
                wallet = new B2BWallet({
                    balance: 0,
                    reseller: resellerId,
                });
            }

            wallet.balance += Number(amount);
            await wallet.save();

            newTransaction.status = "success";
            await newTransaction.save();

            res.status(200).json(newTransaction);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
