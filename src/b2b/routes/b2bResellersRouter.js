const router = require("express").Router();

const { registerSubAgent } = require("../controllers/b2bResellersController");
const { b2bResellerAuth } = require("../middlewares");

router.post("/register", b2bResellerAuth, registerSubAgent);

module.exports = router;
