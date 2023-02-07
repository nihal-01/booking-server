const router = require("express").Router();

const {
    createAttractionOrder,
    completeAttractionOrder,
    getSingleB2bAllOrders,
    getSingleB2bAllOrdersSheet,
    cancelAttractionOrder,
} = require("../controllers/b2bAttractionOrderController");
const { b2bAuth } = require("../middlewares");

router.post("/create", b2bAuth, createAttractionOrder);
router.post("/complete/:orderId", b2bAuth, completeAttractionOrder);
router.post("/cancel", b2bAuth, cancelAttractionOrder);

router.get("/all", getSingleB2bAllOrders);
router.get("/all/sheet", getSingleB2bAllOrdersSheet);

module.exports = router;
