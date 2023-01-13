const router = require("express").Router();

const {
    getAllCurrencies,
    addCurrency,
    deleteCurrency,
    updateCurrency,
} = require("../controllers/admCurrenciesController");

router.get("/all", getAllCurrencies);
router.post("/add", addCurrency);
router.patch("/update/:id", updateCurrency);
router.delete("/delete/:id", deleteCurrency);

module.exports = router;
