const router = require("express").Router();

const { flightAvailability , getSingleTripDetailsWithBundledFare} = require("../controllers/b2bFlightController");
const { b2bAuth } = require("../middlewares");

router.post(`/availability`, b2bAuth, flightAvailability);
router.post('/details/all' , getSingleTripDetailsWithBundledFare)


module.exports = router;
