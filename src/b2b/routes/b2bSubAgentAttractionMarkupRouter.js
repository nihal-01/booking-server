const router = require("express").Router();

const {
    getAllB2bSubAgentAttractionMarkups,
    deleteB2bSubAgentAttractionMarkup,
    upsertB2bSubAgentAttractionMarkup,
} = require("../controllers/b2bSubAgentAttractionMarkupController");
const { b2bAuth } = require("../middlewares");

router.get("/all",b2bAuth, getAllB2bSubAgentAttractionMarkups);
router.patch("/upsert", b2bAuth , upsertB2bSubAgentAttractionMarkup);
router.delete("/delete/:id",b2bAuth , deleteB2bSubAgentAttractionMarkup);

module.exports = router;