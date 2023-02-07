const router = require("express").Router();

const {
    getAllB2cTransactions,
    getAllB2bTransactions,
    getSingleResellerTransactions,
    getB2bTransactionsSheet,
    getSingleResellerTransactionsSheet,
    getAllB2cTransactionsSheet,
} = require("../controllers/admTransactionsController");

router.get("/b2c/all", getAllB2cTransactions);
router.get("/b2c/all/sheet", getAllB2cTransactionsSheet);
router.get("/b2b/all", getAllB2bTransactions);
router.get("/b2b/all/sheet", getB2bTransactionsSheet);
router.get("/b2b/reseller/:resellerId/all", getSingleResellerTransactions);
router.get(
    "/b2b/reseller/:resellerId/all/sheet",
    getSingleResellerTransactionsSheet
);

module.exports = router;
