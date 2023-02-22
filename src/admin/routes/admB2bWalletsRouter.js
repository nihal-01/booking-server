const router = require("express").Router();

const {
  addMoneyToB2bWallet,
  listAllWithdrawRequest,
  onApproveWithdrawal,
  onRejectWithdrawal,
} = require("../controllers/admB2bWalletsController");

router.post("/add-money", addMoneyToB2bWallet);
router.get("/withdraw-request/all", listAllWithdrawRequest);
router.patch("/withdraw/approve/:id", onApproveWithdrawal);
router.patch("/withdraw/reject/:id", onRejectWithdrawal);

module.exports = router;
