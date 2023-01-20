const router = require("express").Router();

const {
    
    deleteB2bClientAttractionMarkup,
    upsertB2bClientAttractionMarkup,
} = require("../controllers/b2bClientAttractionMarkupController");
const { b2bAuth } = require("../middlewares");

router.patch("/upsert", b2bAuth , upsertB2bClientAttractionMarkup);
router.delete("/delete/:id",b2bAuth , deleteB2bClientAttractionMarkup);

module.exports = router;