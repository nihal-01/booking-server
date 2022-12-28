const router = require("express").Router();

const {
    addNewDestination,
    getAllDestinationsByCountry,
} = require("../controllers/admDestinationsController");

router.post("/add", addNewDestination);
router.post("/add/:countryId", getAllDestinationsByCountry);

module.exports = router;
