const router = require("express").Router();

const { getAllCountries } = require("../controllers/countriesController");

router.get("/all", getAllCountries);

module.exports = router;
