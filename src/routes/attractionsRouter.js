const router = require("express").Router();

const {
    getSingleAttraction,
    getAllAttractions,
} = require("../controllers/attractionsController");

router.get("/single/:id", getSingleAttraction);
router.get("/all", getAllAttractions);

module.exports = router;
