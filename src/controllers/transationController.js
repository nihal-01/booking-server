const { sendErrorResponse } = require("../helpers");
const { Transaction, Payment } = require("../models");
const { createOrder, fetchOrder } = require("../utils/paypal");
const { isValidObjectId } = require("mongoose");
const {
  attractionOrderCaptureSchema,
} = require("../validations/attractionOrder.schema");

module.exports = {
  walletDeposit: async (req, res) => {
    try {
      const {
        user,
        paymentProcessor,
        transactionType,
        paymentMethod,
        userType,
        amount,
      } = req.body;

      if (!isValidObjectId(user)) {
        return sendErrorResponse(res, 400, "Invalid category id");
      }

      const currency = "USD";
      const response = await createOrder(amount, currency);

      if (response.statusCode !== 201) {
        return sendErrorResponse(
          res,
          400,
          "Something went wrong while fetching order! Please try again later"
        );
      }

      const newTransation = new Transaction({
        user,
        transactionType,
        paymentMethod,
        userType,
        amount,
        paymentProcessor,
        processStatus: "created",
        paymentStatus: "PENDING",
        paymentId: response.result.id,
      });

      await newTransation.save();
      res.status(200).json(response.result);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  

  capturePayment: async (req, res) => {
    try {
      const { orderId, paymentId } = req.body;

      const { _, error } = attractionOrderCaptureSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(res, 400, error.details[0].message);
      }

      const newTransation = await Transaction.findOne({
        paymentId: orderId,
      });

      console.log(newTransation, "newTransation");
      if (!newTransation) {
        return sendErrorResponse(
          res,
          400,
          "Attraction order not found!. Check with XYZ team if amount is debited from your bank!"
        );
      }

      if (newTransation.processStatus === "completed") {
        return sendErrorResponse(
          res,
          400,
          "This order already completed, Thank you"
        );
      }

      const orderObject = await fetchOrder(orderId);

      if (orderObject.statusCode == "500") {
        return sendErrorResponse(
          res,
          400,
          "Error while fetching order status from paypal. Check with XYZ team if amount is debited from your bank!"
        );


      } else if (orderObject.status !== "COMPLETED") {
        return sendErrorResponse(
          res,
          400,
          "Paypal order status is not Completed. Check with XYZ team if amount is debited from your bank!"
        );


      } else {
        newTransation.paymentStatus = orderObject.status;
        newTransation.paymentId = paymentId;
        await newTransation.save();

        const paymentObject = await fetchPayment(paymentId);

        if (paymentObject.statusCode == "500") {
          return sendErrorResponse(
            res,
            400,
            "Error while fetching payment status from paypal. Check with XYZ team if amount is debited from your bank!"
          );


        } else if (paymentObject.result.status !== "COMPLETED") {
          return sendErrorResponse(
            res,
            400,
            "Paypal payment status is not Completed. Please complete your payment!"
          );
        } else {
          const payment = new Payment({
            merchant: "paypal",
            paymentId,
            paymentOrderId: orderId,
            user: newTransation.user,
            orderType: "attraction",
            order: newTransation._id,
            paymentDetails: paymentObject.result,
          });


          await payment.save();
        }
      }
    } catch (error) {
      sendErrorResponse(res, 500, err);
    }
  },
};
