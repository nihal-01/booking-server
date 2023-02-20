const router = require("express").Router();

const {
  walletDeposit,
  capturePaypalWalletDeposit,
  captureCCAvenueWalletPayment,
  captureRazorpayAttractionPayment,
} = require("../controllers/b2bWalletDepositController");

const {
  walletWithdrawalInitate,
  walletWithdrawalComplete,
} = require("../controllers/b2bWalletWithdrawlController");
const { b2bAuth } = require("../middlewares");

router.post("/deposit", b2bAuth, walletDeposit);
router.post("/paypal/capture", b2bAuth, capturePaypalWalletDeposit);
router.post("/razorpay/capture", captureRazorpayAttractionPayment);
router.post("/ccavenue/capture", captureCCAvenueWalletPayment);
router.post("/withdraw/initiate", b2bAuth, walletWithdrawalInitate);
router.post("/withdraw/complete/:id", b2bAuth, walletWithdrawalComplete);

module.exports = router;
