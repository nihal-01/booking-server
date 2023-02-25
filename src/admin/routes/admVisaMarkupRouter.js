const router = require("express").Router();

const {
    visaListForMarkup,
    upsertB2cClientVisaMarkup,
} = require("../controllers/admVisaListController");

router.get("/all", visaListForMarkup);
router.patch("/upsert", upsertB2cClientVisaMarkup);

module.exports = router;
