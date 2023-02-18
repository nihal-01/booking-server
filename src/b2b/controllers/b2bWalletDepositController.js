
const crypto = require("crypto");
const Razorpay = require("razorpay");
const nodeCCAvenue = require("node-ccavenue");
const qs = require("querystring");

const { sendErrorResponse } = require("../../helpers");
const { HomeSettings } = require("../../models");
const { createOrder, fetchOrder, fetchPayment } = require("../../utils/paypal");
const { sendWalletDeposit } = require("../helpers");
const { B2BTransaction, B2BWallet } = require("../models");
const {
  b2bAttractionOrderCaptureSchema,
} = require("../validations/b2bAttractionOrder.schema");


const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

      await newTransation.save();

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
      } else if (paymentProcessor === "razorpay") {
        const currency = "INR";
        const totalAmountINR = await convertCurrency(amount, currency);
        const options = {
          amount: totalAmountINR * 100,
          currency,
        };
        const order = await instance.orders.create(options);
        return res.status(200).json(order);
      } else if (paymentProcessor === "ccavenue") {
        const orderParams = {
          merchant_id: process.env.CCAVENUE_MERCHANT_ID,
          order_id: newTransation?._id,
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
        return sendErrorResponse(res, 400, "Invalid payment processor");
      }
    } catch (err) {
      // handle transaction fail here
      sendErrorResponse(res, 500, err);
    }
  },

  capturePaypalWalletDeposit: async (req, res) => {
    try {
      const { orderId, paymentId } = req.body;

      const { _, error } = b2bAttractionOrderCaptureSchema.validate(req.body);
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

      // if (!transaction) {
      //     const transaction = new B2BTransaction({
      //         user: attractionOrder.user,
      //         amount: attractionOrder?.totalAmount,
      //         status: "pending",
      //         transactionType: "deduct",
      //         paymentProcessor: "ccavenue",
      //         orderId: attractionOrder?._id,
      //     });
      //     await transaction.save();
      // }

      if (order_status !== "Success") {
        transaction.status = "failed";
        await transaction.save();

        res.writeHead(301, {
          Location: `https://mytravellerschoice.com/attractions/orders/${order_id}/cancelled`,
        });
        res.end();
      } else {
        transaction.status = "success";
        await transaction.save();

        await B2BWallet.updateOne(
          {
            reseller: req.reseller._id,
          },
          {
            $inc: { balance: Number(transaction.amount) },
          },
          { upsert: true, runValidators: true, new: true }
        );

        let reseller = req.reseller;
        const companyDetails = await HomeSettings.findOne();
        sendWalletDeposit(reseller, transaction, companyDetails);

        res.writeHead(301, {
          Location: `https://mytravellerschoice.com/print${order_id}`,
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
      const { razorpay_order_id, transactionid, razorpay_signature, orderId } =
        req.body;

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      const B2BTransaction = await B2BTransaction.findOne({
        _id: orderId,
      });
      if (!B2BTransaction) {
        return sendErrorResponse(
          res,
          400,
          "Attraction order not found!. Please create an order first. Check with our team if amount is debited from your bank!"
        );
      }

      if (B2BTransaction.status === "completed") {
        return sendErrorResponse(
          res,
          400,
          "This order already completed, Thank you. Check with our team if you paid multiple times."
        );
      }

      let transaction = await B2BTransaction.findOne({
        paymentProcessor: "razorpay",
        orderId: attractionOrder?._id,
        status: "pending",
      });
      if (!transaction) {
        const newTransaction = new B2CTransaction({
          user: attractionOrder.user,
          amount: attractionOrder?.totalAmount,
          status: "pending",
          transactionType: "deduct",
          paymentProcessor: "razorpay",
          orderId: attractionOrder?._id,
        });
        await newTransaction.save();
      }

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
