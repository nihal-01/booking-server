const router = require("express").Router();

const {
  registerSubAgent,
  getSingleSubAgent,
  forgetPassword,
  confirmOtpForgetPassword,
  listResellers,
  subAgentAmountDetails,
} = require("../controllers/b2bResellersController");
const { b2bResellerAuth } = require("../middlewares");

router.post("/register", b2bResellerAuth, registerSubAgent);
router.get("/listAll", b2bResellerAuth, listResellers);
router.get("/single/:id", b2bResellerAuth, getSingleSubAgent);
router.patch("/forget/password", forgetPassword);
router.patch("/forget/password/confirm", confirmOtpForgetPassword);

module.exports = router;
