const router = require("express").Router();

const {
    getAllSubscribers,
} = require("../controllers/admSubscribersController");

router.get("/all", getAllSubscribers);

module.exports = router;
