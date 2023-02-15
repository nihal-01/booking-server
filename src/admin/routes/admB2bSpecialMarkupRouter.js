const router = require("express").Router();

const {
  upsertB2bAttractionMarkup,
  listSpecialMarkup,
  upsertB2bVisaMarkup,
  listVisaSpecialMarkup,
} = require("../controllers/adminB2BMarkupController");

router.patch("/attraction/add", upsertB2bAttractionMarkup);
router.get("/:resellerId", listSpecialMarkup);
router.patch("/visa/add", upsertB2bVisaMarkup);
router.get("/visa/:resellerId", listVisaSpecialMarkup);

module.exports = router;
