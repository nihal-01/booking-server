const { upsertB2bSubAgentFlightMarkup } = require("../controllers/b2bFlightMarkupController");



router.patch("/upsert", b2bAuth , upsertB2bSubAgentFlightMarkup);


module.exports = router
