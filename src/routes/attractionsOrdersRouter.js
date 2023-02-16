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
router.post("/cancel", userAuth, cancelAttractionOrder);
router.get("/single/:id",userAuth , getSingleAttractionOrder);
router.get('/all' ,userAuth, getSingleUserAllOrders  )

module.exports = router;
