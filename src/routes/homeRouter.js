const router = require("express").Router();

const { getHomeData } = require("../controllers/homeControllers");

router.get("/", getHomeData);

module.exports = router;
