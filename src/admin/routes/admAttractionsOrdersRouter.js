const router = require("express").Router();

const {
    getAllB2cOrders,
    getAllB2bOrders,
    confirmBooking,
    cancelBooking,
    updateDriverForOrder,
    getSingleResellerAttractionOrders,
} = require("../controllers/admAttractionsOrdersController");

router.get("/b2c/all", getAllB2cOrders);
router.get("/b2b/all", getAllB2bOrders);
router.get("/b2b/reseller/:resellerId/all", getSingleResellerAttractionOrders);
router.patch("/bookings/confirm", confirmBooking);
router.patch("/bookings/cancel", cancelBooking);
router.patch("/assign-driver", updateDriverForOrder);

module.exports = router;
