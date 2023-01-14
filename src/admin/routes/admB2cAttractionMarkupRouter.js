const router = require("express").Router();

const {
    getAllB2cAttractionMarkups,
    deleteB2cAttractionMarkup,
    upsertB2cAttractionMarkup,
} = require("../controllers/admB2cAttractionMarkupController");

router.get("/all", getAllB2cAttractionMarkups);
router.patch("/upsert", upsertB2cAttractionMarkup);
router.delete("/delete/:id", deleteB2cAttractionMarkup);

module.exports = router;
