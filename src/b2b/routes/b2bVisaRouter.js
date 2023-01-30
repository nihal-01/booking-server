const router = require("express").Router();


const { getSingleVisa , getAllVisa} = require("../controllers/b2bVisaController");
const { b2bAuth } = require("../middlewares");

router.get("/single/:id", b2bAuth, getSingleVisa);
router.get("/all", b2bAuth , getAllVisa);
router.post("/apply", b2bAuth , applyVisa);


module.exports = router;