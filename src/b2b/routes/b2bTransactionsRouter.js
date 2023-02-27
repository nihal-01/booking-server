const router = require("express").Router();

const {
    getSingleB2bAllTransactions,
    getSingleB2bAllTransactionsSheet,
    getB2bBalance,
    getSingleSubAgentTransation,
} = require("../controllers/b2bTransationController");
const { b2bAuth } = require("../middlewares");

router.get("/all", b2bAuth, getSingleB2bAllTransactions);
router.get("/sub-agent/:resellerId", b2bAuth, getSingleSubAgentTransation);
router.get("/all/sheet", b2bAuth, getSingleB2bAllTransactionsSheet);
router.get("/balance", b2bAuth, getB2bBalance);

module.exports = router;
