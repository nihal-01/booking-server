const router = require("express").Router();

const {
    getAllOrders,
    confirmBooking,
    cancelBooking,
    updateDriverForOrder,
} = require("../controllers/admAttractionsOrdersController");

router.get("/all", getAllOrders);
router.patch("/bookings/confirm", confirmBooking);
router.patch("/bookings/cancel", cancelBooking);
router.patch("/assign-driver", updateDriverForOrder);

module.exports = router;
