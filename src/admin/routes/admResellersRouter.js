const router = require("express").Router();

const {
    getAllResellers,
    changeResellerStatus,
    getSingleReseller,
} = require("../controllers/admResellersController");

router.get("/all", getAllResellers);
router.get("/single/:id", getSingleReseller);
router.patch("/update/:id/status", changeResellerStatus);

module.exports = router;
