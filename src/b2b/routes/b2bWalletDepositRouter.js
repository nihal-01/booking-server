const router = require("express").Router();

const {
    walletDeposit,
    capturePaypalWalletDeposit,
    captureCCAvenueWalletPayment
} = require("../controllers/b2bWalletDepositController");
const { b2bAuth } = require("../middlewares");

router.post("/deposit",b2bAuth, walletDeposit);
router.post('/paypal/capture' , b2bAuth ,capturePaypalWalletDeposit)
router.post("/ccavenue/capture", captureCCAvenueWalletPayment);


module.exports = router;