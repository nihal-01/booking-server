const router = require("express").Router();

const {
    deleteB2bSubAgentAttractionMarkup,
    upsertB2bSubAgentAttractionMarkup,
} = require("../controllers/b2bSubAgentAttractionMarkupController");
const { b2bAuth } = require("../middlewares");

router.patch("/upsert", b2bAuth , upsertB2bSubAgentAttractionMarkup);
router.delete("/delete/:id",b2bAuth , deleteB2bSubAgentAttractionMarkup);

module.exports = router;