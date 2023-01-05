const router = require("express").Router();

const {
    addNewDestination,
    getAllDestinations,
    updateDestination,
    deleteDestination
} = require("../controllers/admDestinationsController");

router.post("/add", addNewDestination);
router.get("/all", getAllDestinations);
router.patch("/update/:id", updateDestination);
router.delete("/delete/:id", deleteDestination);

module.exports = router;
