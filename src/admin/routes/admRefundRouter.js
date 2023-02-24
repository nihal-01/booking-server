const router = require("express").Router();

const { listRefundAll } = require("../controllers/admRefundController");

router.get("/all", listRefundAll);

module.exports = router;
