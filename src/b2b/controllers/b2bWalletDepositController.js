const crypto = require("crypto");
const Razorpay = require("razorpay");
const nodeCCAvenue = require("node-ccavenue");

const { sendErrorResponse } = require("../../helpers");
const { HomeSettings } = require("../../models");
const { fetchOrder, fetchPayment } = require("../../utils/paypal");
const { sendWalletDeposit } = require("../helpers");
const { B2BTransaction, B2BWallet } = require("../models");
const {
    b2bAttractionOrderCaptureSchema,
} = require("../validations/b2bAttractionOrder.schema");

const ccav = new nodeCCAvenue.Configure({
    merchant_id: process.env.CCAVENUE_MERCHANT_ID,
    working_key: process.env.CCAVENUE_WORKING_KEY,
});

module.exports = {
    walletDeposit: async (req, res) => {
        let newTransaction;
        try {
            const { paymentProcessor, amount } = req.body;

            if (Number(amount) < 10) {
                return sendErrorResponse(
                    res,
                    500,
                    "minimum amount should be 10 or above"
                );
            }

            newTransaction = new B2BTransaction({
                reseller: req.reseller?._id,
                transactionType: "deposit",
                amount,
                paymentProcessor,
                status: "pending",
            });

            await newTransaction.save();

            if (paymentProcessor === "ccavenue") {
                const orderParams = {
                    merchant_id: process.env.CCAVENUE_MERCHANT_ID,
                    order_id: newTransaction?._id,
                    currency: "AED",
                    amount: amount,
                    redirect_url: `${process.env.SERVER_URL}/api/v1/b2b/resellers/wallet/ccavenue/capture`,
                    cancel_url: `${process.env.SERVER_URL}/api/v1/b2b/resellers/wallet/ccavenue/capture`,
                    language: "EN",
                };

                let accessCode = process.env.CCAVENUE_ACCESS_CODE;

                const encRequest = ccav.getEncryptedOrder(orderParams);
                const formbody =
                    '<form id="nonseamless" method="post" name="redirect" action="https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction"/> <input type="hidden" id="encRequest" name="encRequest" value="' +
                    encRequest +
                    '"><input type="hidden" name="access_code" id="access_code" value="' +
                    accessCode +
                    '"><script language="javascript">document.redirect.submit();</script></form>';

                res.setHeader("Content-Type", "text/html");
                res.write(formbody);
                res.end();
                return;
            } else {
                return sendErrorResponse(res, 400, "invalid payment processor");
            }
        } catch (err) {
            if (newTransaction) {
                newTransaction.status = "failed";
                await newTransaction.save();
            }
            sendErrorResponse(res, 500, err);
        }
    },

    capturePaypalWalletDeposit: async (req, res) => {
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
                    transaction.paymentDetails = paymentObject?.result;
                    await transaction.save();

                    // do conversion

                    await B2BWallet.updateOne(
                        {
                            reseller: req.reseller._id,
                        },
                        {
                            $inc: { balance: Number(transaction.amount) },
                        },
                        { upsert: true, runValidators: true, new: true }
                    );
                }
            }

            let reseller = req.reseller;
            const companyDetails = await HomeSettings.findOne();
            sendWalletDeposit(reseller, transaction, companyDetails);

            res.status(200).json({ message: "Transaction Successful" });
        } catch (err) {
            // handle transaction fail here
            sendErrorResponse(res, 500, err);
        }
    },

    captureCCAvenueWalletPayment: async (req, res) => {
        try {
            const { encResp } = req.body;

            const decryptedJsonResponse = ccav.redirectResponseToJson(encResp);
            const { order_id, order_status } = decryptedJsonResponse;

            let transaction = await B2BTransaction.findOne({
                _id: order_id,
                paymentProcessor: "ccavenue",
                status: "pending",
            });
            if (!transaction) {
                return sendErrorResponse(
                    res,
                    400,
                    "something went wrong. if payment is deducted from your bank, then please contact our team."
                );
            }

            if (order_status !== "Success") {
                transaction.status = "failed";
                await transaction.save();

                res.writeHead(301, {
                    Location: `${process.env.REACT_APP_URL}/b2b/wallet/deposit/${order_id}/cancelled`,
                });
                res.end();
            } else {
                transaction.status = "success";
                await transaction.save();

                const ccAvenueFee = (transaction.amount / 100) * 3;

                await B2BWallet.updateOne(
                    {
                        reseller: req.reseller._id,
                    },
                    {
                        $inc: { balance: transaction.amount - ccAvenueFee },
                    },
                    { upsert: true, runValidators: true, new: true }
                );

                let reseller = req.reseller;
                sendWalletDeposit(reseller, transaction);

                res.writeHead(301, {
                    Location: `${process.env.REACT_APP_URL}/b2b/wallet/deposit/${order_id}/success`,
                });
                res.end();
            }
        } catch (err) {
            console.log(err);
            sendErrorResponse(res, 500, err);
        }
    },

    captureRazorpayAttractionPayment: async (req, res) => {
        try {
            const {
                razorpay_order_id,
                transactionid,
                razorpay_signature,
                orderId,
            } = req.body;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "invalid order id");
            }

            let transaction = await B2BTransaction.findOne({
                paymentProcessor: "razorpay",
                orderId: orderId,
                status: "pending",
            });

            if (!transaction) {
                return sendErrorResponse(
                    res,
                    400,
                    "Attraction order not found!. Please create an order first. Check with our team if amount is debited from your bank!"
                );
            }

            if (transaction.status === "success") {
                return sendErrorResponse(
                    res,
                    400,
                    "This order already completed, Thank you. Check with our team if you paid multiple times."
                );
            }

            // if (!transaction) {
            //   const newTransaction = new B2BTransaction({
            //     user: attractionOrder.user,
            //     amount: attractionOrder?.totalAmount,
            //     status: "pending",
            //     transactionType: "deduct",
            //     paymentProcessor: "razorpay",
            //     orderId: attractionOrder?._id,
            //   });
            //   await newTransaction.save();
            // }

            const generated_signature = crypto.createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            );
            generated_signature.update(razorpay_order_id + "|" + transactionid);

            if (generated_signature.digest("hex") !== razorpay_signature) {
                transaction.status = "failed";
                await transaction.save();

                return sendErrorResponse(res, 400, "Transaction failed");
            }

            transaction.status = "success";
            await transaction.save();

            return res.status(200).json({
                message: "Transaction Successful",
            });
        } catch (err) {
            sendErrorResponse(res, 400, err);
        }
    },
};
