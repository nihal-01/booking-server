const router = require("express").Router();

const {
    createAttractionOrder,
    getSingleAttraction,
    createPaymentOrder,
    capturePayment,
    getSingleAttractionOrder,
    getAllAttractions,
} = require("../controllers/attractionsController");
const { userAuthOrNot } = require("../middlewares");

router.post("/orders/initiate", userAuthOrNot, createAttractionOrder);
router.post("/orders/payment", userAuthOrNot, createPaymentOrder);
router.post("/orders/paypal/capture", userAuthOrNot, capturePayment);

router.get("/orders/single/:id", getSingleAttractionOrder);
router.get("/single/:id", getSingleAttraction);
router.get("/all", getAllAttractions);

module.exports = router;
