const router = require("express").Router();

const {
    doSignup,
    doLogin,
    getAccount,
} = require("../controllers/usersController");
const userAuth = require("../middlewares/userAuth");

router.post("/signup", doSignup);
router.post("/login", doLogin);
router.get("/my-account", userAuth, getAccount);

module.exports = router;
