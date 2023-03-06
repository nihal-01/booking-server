const router = require("express").Router();

const {
    upsertB2bSubAgentFlightMarkup,
} = require("../controllers/b2bFlightMarkupController");
const { b2bAuth } = require("../middlewares");

router.patch("/upsert", b2bAuth, upsertB2bSubAgentFlightMarkup);

module.exports = router;
