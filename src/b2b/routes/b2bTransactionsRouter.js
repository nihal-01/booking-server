const router = require("express").Router();

const {
    getSingleB2bAllTransactions,
    getSingleB2bAllTransactionsSheet,
    getB2bBalance,
} = require("../controllers/b2bTransationController");
const { b2bAuth } = require("../middlewares");

router.get("/all", b2bAuth, getSingleB2bAllTransactions);
router.get("/all/sheet", b2bAuth, getSingleB2bAllTransactionsSheet);
router.get("/balance", b2bAuth, getB2bBalance);

module.exports = router;
