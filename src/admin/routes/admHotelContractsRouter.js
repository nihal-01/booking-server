const router = require("express").Router();

const {
    getHotelContracts,
    updateHotelContract,
} = require("../controllers/admHotelContractController");

router.get("/", getHotelContracts);
router.patch("/update", updateHotelContract);

module.exports = router;
