const razorPayPaymentController = require("../controllers/razorPayPaymentController");
require("dotenv").config();

const router = require("express").Router();

router.post("/setOrder", razorPayPaymentController.setOrder);
router.get("/getkey", async (req, res) => {
  return res.status(200).send({ key: process.env.RAZORPAY_API_KEY });
});
router.post("/paymentVerification", razorPayPaymentController.verifyPayment);

module.exports = router;
