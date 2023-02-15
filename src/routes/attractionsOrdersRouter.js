const router = require("express").Router();

const {
    createAttractionOrder,
    capturePaypalAttractionPayment,
    getSingleAttractionOrder,
    initiateAttractionOrderPayment,
    captureCCAvenueAttractionPayment,
    captureRazorpayAttractionPayment,
    cancelAttractionOrder,
    getSingleUserAllOrders} = require("../controllers/attractionsOrdersController");
const { userAuthOrNot, userAuth } = require("../middlewares");

router.post("/create", userAuthOrNot, createAttractionOrder);
router.post("/initiate/:orderId", initiateAttractionOrderPayment);
router.post("/paypal/capture", capturePaypalAttractionPayment);
router.post("/ccavenue/capture", captureCCAvenueAttractionPayment);
router.post("/razorpay/capture", captureRazorpayAttractionPayment);
router.post("/cancel", userAuth, cancelAttractionOrder);
router.get('/all' , getSingleUserAllOrders  )

router.get("/single/:id", getSingleAttractionOrder);

module.exports = router;
