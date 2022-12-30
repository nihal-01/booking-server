const router = require("express").Router();

const {
    getAllCategories,
} = require("../controllers/attractionsCategoriesController");

router.get("/all", getAllCategories);

module.exports = router;
