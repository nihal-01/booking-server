const router = require("express").Router();

const {
    getAllApis,
    addNewApi,
    deleteApi,
    updateApi,
    getSingleApi,
} = require("../controllers/admApiMasterController");

router.get("/all", getAllApis);
router.get("/single/:apiId", getSingleApi);
router.post("/add", addNewApi);
router.delete("/delete/:apiId", deleteApi);
router.patch("/update/:apiId", updateApi);

module.exports = router;
