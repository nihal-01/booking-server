const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../helpers");
const { B2CTransaction } = require("../models");
const { createOrder, fetchOrder } = require("../utils/paypal");
const {
    attractionOrderCaptureSchema,
} = require("../validations/attractionOrder.schema");
const { B2CWallet } = require("../models/b2cWallet.model");

module.exports = {
    walletDeposit: async (req, res) => {
        try {
            const { paymentProcessor, amount } = req.body;

            if (!isValidObjectId(user)) {
                return sendErrorResponse(res, 400, "Invalid category id");
            }

            let result;
            const newTransation = new B2CTransaction({
                user: req.user?._id,
                transactionType: "deposit",
                amount,
                paymentProcessor,
                status: "pending",
                paymentId: result.id,
            });
            
            if (paymentProcessor === "paypal") {
                const currency = "USD";
                const response = await createOrder(amount, currency);

                if (response.statusCode !== 201) {
                    newTransation.status = "failed";
                    await newTransation.save();

                    return sendErrorResponse(
                        res,
                        400,
                        "Something went wrong while fetching order! Please try again later"
                    );
                }

                result = response.result;
            } else {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid payment processor. Please select a valid one"
                );
            }

            await newTransation.save();
            res.status(200).json(result);
        } catch (err) {
            // handle transaction fail here
            sendErrorResponse(res, 500, err);
        }
    },

    captureWalletDeposit: async (req, res) => {
        try {
            const { orderId, paymentId } = req.body;

            const { _, error } = attractionOrderCaptureSchema.validate(
                req.body
            );
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const transaction = await B2CTransaction.findOne({
                paymentId: orderId,
            });

            if (!transaction) {
                return sendErrorResponse(
                    res,
                    400,
                    "Attraction order not found!. Check with XYZ team if amount is debited from your bank!"
                );
            }

            if (transaction.status === "success") {
                transaction.status = "failed";
                await transaction.save();

                return sendErrorResponse(
                    res,
                    400,
                    "This transaction already completed, Thank you"
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
                    transaction.paymentId = paymentId;
                    transaction.paymentDetails = paymentObject.result;
                    await transaction.save();

                    await B2CWallet.findByIdAndUpdate(
                        req.user._id,
                        {
                            $inc: { balance: amount },
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
