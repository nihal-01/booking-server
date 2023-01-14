const router = require("express").Router();
const {
    resellerRegister,
    resellerLogin,
} = require("../controllers/b2bResellersAuthController");

router.post("/signup", resellerRegister);
router.post("/login", resellerLogin);

module.exports = router;
