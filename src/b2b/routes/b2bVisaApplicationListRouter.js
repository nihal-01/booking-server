const { getB2BAllVisaApplication ,getB2BSingleVisaApplication  } = require("../controllers/b2bVisaApplicationListController");
const { b2bAuth } = require("../middlewares");

const router = require("express").Router();

router.get("/all" ,b2bAuth , getB2BAllVisaApplication )
router.get("/:id" ,b2bAuth , getB2BSingleVisaApplication )



module.exports = router;