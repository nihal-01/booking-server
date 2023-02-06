const nodeCCAvenue = require("node-ccavenue");
const qs = require("querystring");

const { sendErrorResponse } = require("../../helpers");
const { createOrder, fetchOrder, fetchPayment } = require("../../utils/paypal");
const { B2BTransaction, B2BWallet } = require("../models");
const {
    b2bAttractionOrderCaptureSchema,
} = require("../validations/b2bAttractionOrder.schema");

const ccav = new nodeCCAvenue.Configure({
    merchant_id: process.env.CCAVENUE_MERCHANT_ID,
    working_key: process.env.CCAVENUE_WORKING_KEY,
});

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

            if (paymentProcessor === "paypal") {
                const currency = "USD";
                const response = await createOrder(amount, currency);

                newTransation.paymentOrderId = response.result.id;
                const resultFinal = response.result;

                if (response.statusCode !== 201) {
                    newTransation.status = "failed";
                    await newTransation.save();

                    return sendErrorResponse(
                        res,
                        400,
                        "Something went wrong while fetching order! Please try again later"
                    );
                }

                await newTransation.save();
                res.status(200).json(resultFinal);
            } else if (paymentProcessor === "ccavenue") {
                let body = "";
                body += {
                    merchant_id: process.env.CCAVENUE_MERCHANT_ID,
                    order_id: newTransation?._id,
                    currency: "AED",
                    amount: Number(amount),
                    redirect_url: "",
                    cancel_url: "",
                    language: "EN",
                };
                let accessCode = process.env.CCAVENUE_ACCESS_CODE;

                const encRequest = ccav.encrypt(body);
                const formbody =
                    '<form id="nonseamless" method="post" name="redirect" action="https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction"/> <input type="hidden" id="encRequest" name="encRequest" value="' +
                    encRequest +
                    '"><input type="hidden" name="access_code" id="access_code" value="' +
                    accessCode +
                    '"><script language="javascript">document.redirect.submit();</script></form>';

                await newTransation.save();

                res.setHeader("Content-Type", "text/html");
                res.write(formbody);
                res.end();
                return;
            } else {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid payment processor. Please select a valid one"
                );
            }
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
                    transaction.paymentDetails = paymentObject?.result;
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

    captureCCAvenueWalletDeposit: async (req, res) => {
        try {
            let ccavEncResponse = "";
            ccavEncResponse += req.body;

            const ccavPOST = qs.parse(ccavEncResponse);
            const encryption = ccavPOST.encResp;
            const ccavResponse = ccav.decrypt(encryption);

            // complete transaction here

            let pData = "";
            pData = "<table border=1 cellspacing=2 cellpadding=2><tr><td>";
            pData = pData + ccavResponse.replace(/=/gi, "</td><td>");
            pData = pData.replace(/&/gi, "</td></tr><tr><td>");
            pData = pData + "</td></tr></table>";
            htmlcode =
                '<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Response Handler</title></head><body><center><font size="4" color="blue"><b>Response Page</b></font><br>' +
                pData +
                "</center><br></body></html>";

            res.writeHeader(200, { "Content-Type": "text/html" });
            res.write(htmlcode);
            res.end();
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
