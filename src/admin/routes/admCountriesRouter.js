const router = require("express").Router();

const {
    addNewCountry,
    getAllCountries,
    deleteCountry,
    updateCountry,
} = require("../controllers/admCountriesController");

router.post("/add", addNewCountry);
router.get("/all", getAllCountries);
router.patch("/update/:id", updateCountry);
router.delete("/delete/:id", deleteCountry);

module.exports = router;
