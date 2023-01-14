const router = require("express").Router();
const {walletDeposit , capturePayment} = require('../controllers/transationController')



router.post("/deposit", walletDeposit);
router.post("/deposit/paypal/capture" , capturePayment)


module.exports = router;