

const { upsertB2bClientFlightMarkup } = require("../controllers/b2bFlightMarkupController");
const { b2bAuth } = require("../middlewares");


router.patch("/upsert", b2bAuth , upsertB2bClientFlightMarkup);
// router.delete("/delete/:id",b2bAuth , deleteB2bClientVisaMarkup);

module.exports = router
