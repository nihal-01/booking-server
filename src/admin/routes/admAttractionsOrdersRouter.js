const router = require("express").Router();

const {
    getAllOrders,
    confirmBooking,
} = require("../controllers/admAttractionsOrdersController");

router.get("/all", getAllOrders);
router.patch("/bookings/confirm", confirmBooking);

module.exports = router;
