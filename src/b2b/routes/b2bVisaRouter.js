const router = require("express").Router();


const { getSingleVisa } = require("../controllers/b2bVisaController");
const { b2bAuth } = require("../middlewares");

router.get("/single/:id", b2bAuth, getSingleVisa);
// router.get("/all", b2bAuth , getAllAttractions);
// router.get("/listall", b2bAuth , listAllAttractions);


module.exports = router;