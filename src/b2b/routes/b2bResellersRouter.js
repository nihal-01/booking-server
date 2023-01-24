const router = require("express").Router();

const { registerSubAgent ,getSingleSubAgent , listResellers} = require("../controllers/b2bResellersController");
const { b2bResellerAuth } = require("../middlewares");

router.post("/register", b2bResellerAuth, registerSubAgent);
router.get("/listAll", b2bResellerAuth, listResellers);
router.get("/single/:id", getSingleSubAgent);



module.exports = router;
