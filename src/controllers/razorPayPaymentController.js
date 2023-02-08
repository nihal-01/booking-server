const instance = require("../config/razorPay");
const { sendErrorResponse } = require("../helpers");
const crypto = require("crypto");

module.exports = {
  setOrder: async (req, res) => {
    try {
      const { price } = req.body;
      const options = {
        amount: price * 100,
        currency: "AED",
        receipt: "receipt#1",
        partial_payment: false,
        notes: {
          key1: "value3",
          key2: "value2",
        },
      };
      const order = await instance.orders.create(options);
      return res.status(200).send({ success: true, order: order });
    } catch (error) {
      sendErrorResponse(res, 500, error.message);
    }
  },
  verifyPayment: async (req, res) => {
    try {
      const {
        ids: { razorpay_payment_id, razorpay_order_id, razorpay_signature },
      } = req.body;

      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;
      if (isAuthentic) return res.status(200).send({ isValid: true });

      return res.status(400).send({ isValid: false });
    } catch (error) {
      sendErrorResponse(res, 500, error.message);
    }
  },
};
