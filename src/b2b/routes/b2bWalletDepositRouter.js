const router = require("express").Router();

const {
    walletDeposit,
    captureWalletDeposit
} = require("../controllers/b2bWalletDepositController");
const { b2bAuth } = require("../middlewares");

router.post("/deposit",b2bAuth, walletDeposit);
router.post('/paypal/capture' , b2bAuth ,captureWalletDeposit)

module.exports = router;