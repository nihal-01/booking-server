const router = require("express").Router();

const {
    updateHotelContract,
    getSingleMonthHotelContract,
} = require("../controllers/admHotelContractController");

router.patch("/update", updateHotelContract);
router.get("/hotel/:id/:month/:year", getSingleMonthHotelContract);

module.exports = router;
