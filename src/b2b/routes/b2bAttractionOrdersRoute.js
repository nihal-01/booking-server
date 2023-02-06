const router = require("express").Router();

const {
    createAttractionOrder,
    completeAttractionOrder,
    // getSingleAttractionOrder,
    getSingleB2bAllOrders,
    getSingleB2bAllOrdersSheet,
} = require("../controllers/b2bAttractionOrderController");
const { b2bAuth } = require("../middlewares");

router.post("/create", b2bAuth, createAttractionOrder);
router.post("/complete/:orderId", b2bAuth, completeAttractionOrder);
// router.get("/single/:id", getSingleAttractionOrder);

router.get("/all", getSingleB2bAllOrders);
router.get("/all/sheet", getSingleB2bAllOrdersSheet);

module.exports = router;
