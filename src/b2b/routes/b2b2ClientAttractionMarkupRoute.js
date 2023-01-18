const router = require("express").Router();

const {
    getAllB2cAttractionMarkups,
    deleteB2cAttractionMarkup,
    upsertB2cAttractionMarkup,
} = require("../controllers/b2bClientAttractionMarkupController");
const { b2bAuth } = require("../middlewares");

router.get("/all", getAllB2cAttractionMarkups);
router.patch("/upsert", b2bAuth , upsertB2cAttractionMarkup);
router.delete("/delete/:id", deleteB2cAttractionMarkup);

module.exports = router;