const router = require("express").Router();


const { upsertB2bClientVisaMarkup } = require("../controllers/b2bClientVisaMarkupController");
const { b2bAuth } = require("../middlewares");

router.patch("/upsert", b2bAuth , upsertB2bClientVisaMarkup);

module.exports = router;