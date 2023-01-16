const router = require("express").Router();

const { b2bResellersAuthRouter, b2bResellersRouter } = require("./routes");

router.use("/resellers/auth", b2bResellersAuthRouter);
router.use("/resellers", b2bResellersRouter);

module.exports = router;
