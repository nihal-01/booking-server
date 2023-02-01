const router = require("express").Router();



const { getSingleVisa,listAll,getAllVisa, listAllCountry  } = require("../controllers/b2bVisaListController");
const { b2bAuth } = require("../middlewares");

router.get("/single/:id", b2bAuth, getSingleVisa);
router.get("/all", b2bAuth , getAllVisa);
router.get("/list" ,b2bAuth , listAll  )
router.get("/country/all" ,b2bAuth ,listAllCountry)



module.exports = router;