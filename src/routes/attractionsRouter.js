const router = require("express").Router();

const {
    createAttractionOrder,
} = require("../controllers/attractionsController");
const { userAuthOrNot } = require("../middlewares");

router.post("/orders/initiate", userAuthOrNot, createAttractionOrder);

module.exports = router;
