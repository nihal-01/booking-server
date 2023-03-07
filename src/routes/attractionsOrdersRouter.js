const router = require("express").Router();

const {
    createAttractionOrder,
    capturePaypalAttractionPayment,
    getSingleAttractionOrder,
    captureCCAvenueAttractionPayment,
    captureRazorpayAttractionPayment,
    cancelAttractionOrder,
    refundRequest,
    getSingleUserAllOrders,
    getAttractionOrderTickets,
    getAttractionOrderSingleTickets,
} = require("../controllers/attractionsOrdersController");
const { userAuthOrNot, userAuth } = require("../middlewares");

router.post("/create", userAuthOrNot, createAttractionOrder);
router.post("/paypal/capture", capturePaypalAttractionPayment);
router.post("/ccavenue/capture", captureCCAvenueAttractionPayment);
router.post("/razorpay/capture", captureRazorpayAttractionPayment);
router.post("/cancel", userAuth, cancelAttractionOrder);
router.post("/cancel", userAuth, cancelAttractionOrder);
router.get("/single/:id", userAuth, getSingleAttractionOrder);
router.get("/all", userAuth, getSingleUserAllOrders);
router.get("/:orderId/ticket/:activityId", getAttractionOrderTickets);
router.post(
    "/:orderId/ticket/:activityId/single",
    getAttractionOrderSingleTickets
);
router.post("/:orderId/refund/:orderItemId", userAuth, refundRequest);

module.exports = router;
