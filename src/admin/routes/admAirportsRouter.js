const router = require("express").Router();

const {
    getAllAirports,
    addNewAirport,
    deleteAirport,
    getSingleAirport,
    updateAirport,
} = require("../controllers/admAirportsController");

router.get("/all", getAllAirports);
router.get("/single/:id", getSingleAirport);
router.post("/add", addNewAirport);
router.patch("/update/:id", updateAirport);
router.delete("/delete/:id", deleteAirport);

module.exports = router;
