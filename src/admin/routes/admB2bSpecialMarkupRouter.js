const router = require("express").Router();

const {
  upsertB2bAttractionMarkup,
  listAttractionSpecialMarkup,
  upsertB2bVisaMarkup,
  listVisaSpecialMarkup,
} = require("../controllers/adminB2BMarkupController");

router.patch("/attraction/add", upsertB2bAttractionMarkup);
router.get("/attraction/:resellerId", listAttractionSpecialMarkup);
router.patch("/visa/add", upsertB2bVisaMarkup);
router.get("/visa/:resellerId", listVisaSpecialMarkup);

module.exports = router;
