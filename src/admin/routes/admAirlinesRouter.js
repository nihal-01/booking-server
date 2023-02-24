const router = require("express").Router();

const {
    getAllAirlines,
    addNewAirline,
    deleteAirline,
    getSingleAirline,
    updateAirline,
} = require("../controllers/admAirlinesController");

router.get("/all", getAllAirlines);
router.get("/single/:id", getSingleAirline);
router.post("/add", addNewAirline);
router.patch("/update/:id", updateAirline);
router.delete("/delete/:id", deleteAirline);

module.exports = router;
