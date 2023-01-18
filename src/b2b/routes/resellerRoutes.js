const router = require("express").Router();
const {resellerRegister } = require ('../controllers/resellerController');
const { b2bResellerAuth } = require("../middlewares");

router.post("/register", b2bResellerAuth, resellerRegister);


module.exports = router;
