const router = require("express").Router();

const {
    walletDeposit
} = require("../controllers/b2bWalletDepositController");
const { b2bAuth } = require("../middlewares");

router.post("/deposit",b2bAuth, walletDeposit);

module.exports = router;