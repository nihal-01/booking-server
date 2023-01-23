const router = require("express").Router();

const {
    createAttractionOrder,
    getSingleAttractionOrder,
} = require("../controllers/b2bAttractionOrderController");
const { b2bAuth } = require("../middlewares");



router.post("/create", b2bAuth , createAttractionOrder);
router.get("/single/:id", getSingleAttractionOrder);

module.exports = router;
