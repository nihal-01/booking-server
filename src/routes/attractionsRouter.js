const router = require("express").Router();

const {
    createAttractionOrder,
    getSingleAttraction,
    capturePayment,
    getSingleAttractionOrder,
    getAllAttractions,
} = require("../controllers/attractionsController");
const { userAuthOrNot } = require("../middlewares");

router.post("/orders/create", userAuthOrNot, createAttractionOrder);
router.post("/orders/paypal/capture", userAuthOrNot, capturePayment);

router.get("/orders/single/:id", getSingleAttractionOrder);
router.get("/single/:id", getSingleAttraction);
router.get("/all", getAllAttractions);

module.exports = router;
