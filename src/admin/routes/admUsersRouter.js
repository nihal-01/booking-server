const router = require("express").Router();

const { getAllUsers } = require("../controllers/admUsersController");

router.get("/all", getAllUsers);

module.exports = router;
