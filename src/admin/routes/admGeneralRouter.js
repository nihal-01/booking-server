const router = require("express").Router();

const { getGeneralData } = require("../controllers/admGeneralController");

router.get("/", getGeneralData);

module.exports = router;
