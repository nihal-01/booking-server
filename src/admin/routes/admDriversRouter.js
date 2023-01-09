const {
    addNewDriver,
    updateDriver,
    deleteDriver,
} = require("../controllers/admDriversController");

const router = require("express").Router();

router.post("/add", addNewDriver);
router.patch("/update/:id", updateDriver);
router.delete("/delete/:id", deleteDriver);

module.exports = router;
