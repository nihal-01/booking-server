const {
    getAllEmailServices,
    addNewEmailService,
    deleteEmailService,
    updateEmailService,
} = require("../controllers/admEmailServicesController");

const router = require("express").Router();

router.get("/all", getAllEmailServices);
router.post("/add", addNewEmailService);
router.delete("/delete/:id", deleteEmailService);
router.patch("/update/:id", updateEmailService);

module.exports = router;
