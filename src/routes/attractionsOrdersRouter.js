const router = require("express").Router();

const {
    createAttractionOrder,
    capturePayment,
    getSingleAttractionOrder,
} = require("../controllers/attractionsOrdersController");
const { userAuthOrNot } = require("../middlewares");

router.post("/create", userAuthOrNot, createAttractionOrder);
router.post("/paypal/capture", capturePayment);

router.get("/single/:id", getSingleAttractionOrder);

module.exports = router;
