const router = require("express").Router();

const { getAllResellers } = require("../controllers/admResellersController");

router.get("/all", getAllResellers);

module.exports = router;
