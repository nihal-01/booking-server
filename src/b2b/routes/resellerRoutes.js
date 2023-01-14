const router = require("express").Router();
const {resellerRegister ,resellerLogin } = require ('../controllers/resellerController')

router.post("/register", resellerRegister);
router.post("/login", resellerLogin);



module.exports = router;
