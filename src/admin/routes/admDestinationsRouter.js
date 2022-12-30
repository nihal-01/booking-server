const router = require("express").Router();

const {
    addNewDestination,
    getAllDestinations,
} = require("../controllers/admDestinationsController");

router.post("/add", addNewDestination);
router.get("/all", getAllDestinations);

module.exports = router;
