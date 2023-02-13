const router = require("express").Router();

const {
  upsertB2bMarkup,
  listSpecialMarkup,
} = require("../controllers/adminB2BMarkupController");

router.patch("/add", upsertB2bMarkup);
router.get("/:resellerId", listSpecialMarkup);

module.exports = router;
