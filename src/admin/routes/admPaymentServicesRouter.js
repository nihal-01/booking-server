const {
    getAllPaymentServices,
    addPaymentService,
    deletePaymentService,
    updatePaymentService,
} = require("../controllers/admPaymentServicesController");

const router = require("express").Router();

router.get("/all", getAllPaymentServices);
router.post("/add", addPaymentService);
router.patch("/update/:id", updatePaymentService);
router.delete("/delete/:id", deletePaymentService);

module.exports = router;
