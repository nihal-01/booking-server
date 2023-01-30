const router = require("express").Router();


const {upsertB2bSubAgentVisaMarkup} = require("../controllers/b2bSubAgentVisaMarkupController");
const { b2bResellerAuth } = require("../middlewares");

router.patch("/upsert", b2bResellerAuth , upsertB2bSubAgentVisaMarkup );

module.exports = router;