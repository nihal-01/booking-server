const { getB2BVisaApplicationStatus } = require("../controllers/b2bVisaStatusController");
const { b2bAuth } = require("../middlewares");

const router = require("express").Router();

router.get("/status" ,b2bAuth , getB2BVisaApplicationStatus  )


module.exports = router;