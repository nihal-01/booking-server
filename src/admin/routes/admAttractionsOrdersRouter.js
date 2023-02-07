const router = require("express").Router();

const {
    getAllB2cOrders,
    getAllB2cOrdersSheet,
    getAllB2bOrders,
    confirmBooking,
    cancelBooking,
    updateDriverForOrder,
    getSingleResellerAttractionOrders,
    getB2bAllOrdersSheet,
    getSingleResellerAttractionOrdersSheet,
} = require("../controllers/admAttractionsOrdersController");

router.get("/b2c/all", getAllB2cOrders);
router.get("/b2c/all/sheet", getAllB2cOrdersSheet);
router.get("/b2b/all", getAllB2bOrders);
router.get("/b2b/all/sheet", getB2bAllOrdersSheet);
router.get("/b2b/reseller/:resellerId/all", getSingleResellerAttractionOrders);
router.get(
    "/b2b/reseller/:resellerId/all/sheet",
    getSingleResellerAttractionOrdersSheet
);
router.patch("/bookings/confirm", confirmBooking);
router.patch("/bookings/cancel", cancelBooking);
router.patch("/assign-driver", updateDriverForOrder);

module.exports = router;
