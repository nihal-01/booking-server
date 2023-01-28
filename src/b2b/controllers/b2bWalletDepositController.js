const { sendErrorResponse } = require("../../helpers");
const { createOrder, fetchOrder, fetchPayment } = require("../../utils/paypal");
const { B2BTransaction, B2BWallet } = require("../models");
const {
    b2bAttractionOrderCaptureSchema,
} = require("../validations/b2bAttractionOrder.schema");

module.exports = {
    // TODO
    // 1. Currency conversions
    walletDeposit: async (req, res) => {
        try {
            const { paymentProcessor, amount } = req.body;

            const newTransation = new B2BTransaction({
                reseller: req.reseller?._id,
                transactionType: "deposit",
                amount,
                paymentProcessor,
                status: "pending",
            });

            let resultFinal;
            if (paymentProcessor === "paypal") {
                const currency = "USD";
                const response = await createOrder(amount, currency);

                newTransation.paymentOrderId = response.result.id;
                resultFinal = response.result;

                if (response.statusCode !== 201) {
                    newTransation.status = "failed";
                    await newTransation.save();

                    return sendErrorResponse(
                        res,
                        400,
                        "Something went wrong while fetching order! Please try again later"
                    );
                }
            } else if (paymentProcessor === "razorpay") {
            } else {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid payment processor. Please select a valid one"
                );
            }

            await newTransation.save();
            res.status(200).json(resultFinal);
        } catch (err) {
            // handle transaction fail here
            sendErrorResponse(res, 500, err);
        }
    },

    captureWalletDeposit: async (req, res) => {
        try {
            const { orderId, paymentId } = req.body;

            const { _, error } = b2bAttractionOrderCaptureSchema.validate(
                req.body
            );
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const transaction = await B2BTransaction.findOne({
                paymentOrderId: orderId,
            });

            if (!transaction) {
                return sendErrorResponse(
                    res,
                    400,
                    "transation not found!. check with the team if amount is debited from your bank!"
                );
            }

            if (transaction.status === "success") {
                return sendErrorResponse(
                    res,
                    400,
                    "this transaction already completed, Thank you"
                );
            }

            const orderObject = await fetchOrder(orderId);

            if (orderObject.statusCode == "500") {
                transaction.status = "failed";
                await transaction.save();

                return sendErrorResponse(
                    res,
                    400,
                    "Error while fetching order status from paypal. Check with XYZ team if amount is debited from your bank!"
                );
            } else if (orderObject.status !== "COMPLETED") {
                transaction.status = "failed";
                await transaction.save();

                return sendErrorResponse(
                    res,
                    400,
                    "Paypal order status is not Completed. Check with XYZ team if amount is debited from your bank!"
                );
            } else {
                const paymentObject = await fetchPayment(paymentId);

                if (paymentObject.statusCode == "500") {
                    transaction.status = "failed";
                    await transaction.save();

                    return sendErrorResponse(
                        res,
                        400,
                        "Error while fetching payment status from paypal. Check with XYZ team if amount is debited from your bank!"
                    );
                } else if (paymentObject.result.status !== "COMPLETED") {
                    transaction.status = "failed";
                    await transaction.save();

                    return sendErrorResponse(
                        res,
                        400,
                        "Paypal payment status is not Completed. Please complete your payment!"
                    );
                } else {
                    transaction.status = "success";
                    transaction.paymentDetails = paymentObject.result;
                    await transaction.save();

                    // do conversion

                    await B2BWallet.updateOne(
                        {
                            reseller: req.reseller._id,
                        },
                        {
                            $inc: { balance: transaction.amount },
                        },
                        { upsert: true, runValidators: true, new: true }
                    );
                }
            }

            res.status(200).json({ message: "Transaction Successful" });
        } catch (err) {
            // handle transaction fail here
            sendErrorResponse(res, 500, err);
        }
    },
};
