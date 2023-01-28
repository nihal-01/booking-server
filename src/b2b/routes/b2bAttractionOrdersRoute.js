const router = require("express").Router();

const {
    createAttractionOrder,
    completeAttractionOrder,
    // getSingleAttractionOrder,
} = require("../controllers/b2bAttractionOrderController");
const { b2bAuth } = require("../middlewares");

router.post("/create", b2bAuth, createAttractionOrder);
router.post("/complete/:orderId", b2bAuth, completeAttractionOrder);
// router.get("/single/:id", getSingleAttractionOrder);

module.exports = router;
