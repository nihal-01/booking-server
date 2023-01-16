const router = require("express").Router();

const { b2bResellersAuthRouter, b2bSubAgentAuthRouter } = require("./routes");

router.use("/resellers/auth", b2bResellersAuthRouter);
router.use("/subagent/auth", b2bSubAgentAuthRouter);


module.exports = router;
