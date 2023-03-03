const router = require("express").Router();

const { flightAvailability } = require("../controllers/b2bFlightController");

router.post(`/availability`, flightAvailability);

module.exports = router;
