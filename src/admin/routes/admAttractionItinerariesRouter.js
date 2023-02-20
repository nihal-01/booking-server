const router = require("express").Router();
const {
    getAllAttractionItineraries,
    createAttractionItinerary,
    deleteAttractionItinerary,
    getSingleAttractionItinerary,
    updateAttractionItinerary,
} = require("../controllers/admAttractionItinerariesController");

router.get("/all", getAllAttractionItineraries);
router.post("/add", createAttractionItinerary);
router.delete("/delete/:id", deleteAttractionItinerary);
router.get("/single/:id", getSingleAttractionItinerary);
router.post("/update/:id", updateAttractionItinerary);

module.exports = router;
