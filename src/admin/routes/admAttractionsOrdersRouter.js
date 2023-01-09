const router = require("express").Router();

const {
    getAllOrders,
    confirmBooking,
    cancelBooking,
    assignDriverForTicketOrder,
} = require("../controllers/admAttractionsOrdersController");

router.get("/all", getAllOrders);
router.patch("/bookings/confirm", confirmBooking);
router.patch("/bookings/cancel", cancelBooking);
router.patch("/tickets/assign-driver", assignDriverForTicketOrder);

module.exports = router;
