const router = require("express").Router();
const multer = require("multer");
const path = require("path");

const resellerAuth = require("../middleware/b2bResellerAuthVerify");
const {registerSubAgent} = require("../controllers/b2bSubAgentController");


router.post("/register",resellerAuth , registerSubAgent);


module.exports = router;
