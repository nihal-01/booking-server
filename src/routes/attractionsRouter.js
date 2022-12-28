const router = require("express").Router();

const {
    createAttractionOrder,
    getSingleAttraction,
} = require("../controllers/attractionsController");
const { userAuthOrNot } = require("../middlewares");

router.post("/orders/initiate", userAuthOrNot, createAttractionOrder);
router.get("/single/:id", getSingleAttraction);

module.exports = router;
