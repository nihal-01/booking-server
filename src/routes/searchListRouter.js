const router = require("express").Router();

const {
    searchDestinationAndAtt,
} = require("../controllers/serachListController");

router.get("/list", searchDestinationAndAtt);

module.exports = router;
