const router = require("express").Router();

const {
  addMoneyToB2bWallet,
  listAllWithdrawRequest,
  onApproveWithdrawal,
} = require("../controllers/admB2bWalletsController");

router.post("/add-money", addMoneyToB2bWallet);
router.get("/withdraw-request/all", listAllWithdrawRequest);
router.patch("/withdraw/approve/:id", onApproveWithdrawal);
module.exports = router;
