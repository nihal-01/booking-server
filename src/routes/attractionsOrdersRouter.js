const router = require("express").Router();

const {
    createAttractionOrder,
    capturePaypalAttractionPayment,
    getSingleAttractionOrder,
    initiateAttractionOrderPayment,
    captureCCAvenueAttractionPayment,
    captureRazorpayAttractionPayment,
} = require("../controllers/attractionsOrdersController");
const { userAuthOrNot } = require("../middlewares");

router.post("/create", userAuthOrNot, createAttractionOrder);
router.post("/initiate/:orderId", initiateAttractionOrderPayment);
router.post("/paypal/capture", capturePaypalAttractionPayment);
router.post("/ccavenue/capture", captureCCAvenueAttractionPayment);
router.post("/razorpay/capture", captureRazorpayAttractionPayment);

router.get("/single/:id", getSingleAttractionOrder);

module.exports = router;
