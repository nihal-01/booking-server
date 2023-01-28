const router = require("express").Router();

const {
    getAllB2cOrders,
    getAllB2bOrders,
    confirmBooking,
    cancelBooking,
    updateDriverForOrder,
} = require("../controllers/admAttractionsOrdersController");

router.get("/b2c/all", getAllB2cOrders);
router.get("/b2b/all", getAllB2bOrders);
router.patch("/bookings/confirm", confirmBooking);
router.patch("/bookings/cancel", cancelBooking);
router.patch("/assign-driver", updateDriverForOrder);

module.exports = router;
