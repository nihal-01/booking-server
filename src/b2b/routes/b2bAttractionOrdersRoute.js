const router = require("express").Router();

const {
    createAttractionOrder,
    completeAttractionOrder,
    getSingleB2bAllOrders,
    getSingleB2bAllOrdersSheet,
    cancelAttractionOrder,
    getSingleAttractionOrder,
} = require("../controllers/b2bAttractionOrderController");
const { b2bAuth } = require("../middlewares");

router.post("/create", b2bAuth, createAttractionOrder);
router.post("/complete/:orderId", b2bAuth, completeAttractionOrder);
router.post("/cancel", b2bAuth, cancelAttractionOrder);

router.get("/all", b2bAuth, getSingleB2bAllOrders);
router.get("/all/sheet", b2bAuth, getSingleB2bAllOrdersSheet);
router.get("/single/:orderId", b2bAuth, getSingleAttractionOrder);
router.get('/attraction/invoice')

module.exports = router;
