const router = require("express").Router();

const {
    getAllB2cTransactions,
    getAllB2bTransactions,
} = require("../controllers/admTransactionsController");

router.get("/b2c/all", getAllB2cTransactions);
router.get("/b2b/all", getAllB2bTransactions);

module.exports = router;
