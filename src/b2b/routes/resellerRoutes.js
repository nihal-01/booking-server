const router = require("express").Router();
const {resellerRegister } = require ('../controllers/resellerController')

router.post("/register", resellerRegister);


module.exports = router;
