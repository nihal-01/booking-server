const router = require("express").Router();

const {
    getAllB2cTransactions,
    getAllB2bTransactions,
    getSingleResellerTransactions,
} = require("../controllers/admTransactionsController");

router.get("/b2c/all", getAllB2cTransactions);
router.get("/b2b/all", getAllB2bTransactions);
router.get("/b2b/reseller/:resellerId/all", getSingleResellerTransactions);

module.exports = router;
