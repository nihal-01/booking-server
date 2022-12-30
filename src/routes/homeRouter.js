const router = require("express").Router();

const {
    getHomeData,
    getInitialData,
} = require("../controllers/homeControllers");

router.get("/", getHomeData);
router.get("/initial-data", getInitialData);

module.exports = router;
