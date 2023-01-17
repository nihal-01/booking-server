const router = require("express").Router();

const {
    getAllB2cTransactions,
} = require("../controllers/admTransactionsController");

router.get("/b2c/all", getAllB2cTransactions);

module.exports = router;
