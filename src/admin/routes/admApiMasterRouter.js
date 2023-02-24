const router = require("express").Router();

const {
    getAllApis,
    addNewApi,
    deleteApi,
    updateApi,
    getSingleApi,
    getAllFlightApis,
} = require("../controllers/admApiMasterController");

router.get("/all", getAllApis);
router.get("/single/:apiId", getSingleApi);
router.get("/all/flight", getAllFlightApis);
router.post("/add", addNewApi);
router.delete("/delete/:apiId", deleteApi);
router.patch("/update/:apiId", updateApi);

module.exports = router;
