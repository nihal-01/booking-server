const router = require("express").Router();

const {
    getAllResellers,
    changeResellerStatus,
    getSingleReseller,
    getSingleResellersSubagents,
} = require("../controllers/admResellersController");

router.get("/all", getAllResellers);
router.get("/single/:id", getSingleReseller);
router.get("/:resellerId/sub-agents", getSingleResellersSubagents);
router.patch("/update/:id/status", changeResellerStatus);

module.exports = router;
