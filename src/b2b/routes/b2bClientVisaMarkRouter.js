const router = require("express").Router();


const { upsertB2bClientVisaMarkup ,  deleteB2bClientVisaMarkup} = require("../controllers/b2bClientVisaMarkupController");
const { b2bAuth } = require("../middlewares");

router.patch("/upsert", b2bAuth , upsertB2bClientVisaMarkup);
router.delete("/delete/:id",b2bAuth , deleteB2bClientVisaMarkup);

module.exports = router;