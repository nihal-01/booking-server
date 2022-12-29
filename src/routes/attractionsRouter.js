const router = require("express").Router();

const {
    createAttractionOrder,
    getSingleAttraction,
    createPaymentOrder,
    capturePayment,
} = require("../controllers/attractionsController");
const { userAuthOrNot } = require("../middlewares");

router.post("/orders/initiate", userAuthOrNot, createAttractionOrder);
router.post("/orders/payment", userAuthOrNot, createPaymentOrder);
router.post("/orders/paypal/capture", userAuthOrNot, capturePayment);

router.get("/single/:id", getSingleAttraction);

module.exports = router;
