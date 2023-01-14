const router = require("express").Router();

const { b2bResellersAuthRouter } = require("./routes");

router.use("/resellers/auth", b2bResellersAuthRouter);

module.exports = router;
