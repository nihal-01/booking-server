const router = require("express").Router();

const {
    getB2BTransactions,
    getB2bBalance,
} = require("../controllers/b2bTransationController");
const { b2bAuth } = require("../middlewares");

router.get("/all", b2bAuth, getB2BTransactions);
router.get("/balance", b2bAuth, getB2bBalance);

module.exports = router;
