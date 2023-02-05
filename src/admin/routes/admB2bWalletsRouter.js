const router = require("express").Router();

const {
    addMoneyToB2bWallet,
} = require("../controllers/admB2bWalletsController");

router.post("/add-money", addMoneyToB2bWallet);

module.exports = router;
