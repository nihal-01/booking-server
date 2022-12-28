const router = require("express").Router();

const {
    addNewCountry,
    getAllCountries,
} = require("../controllers/admCountriesController");

router.post("/add", addNewCountry);
router.get("/all", getAllCountries);

module.exports = router;
