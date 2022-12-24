const router = require("express").Router();

const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
} = require("../controllers/admCategoriesController");

router.post("/create", createCategory);
router.get("/all", getAllCategories);
router.patch("/update/:id", updateCategory);
router.delete("/delete/:id", deleteCategory);

module.exports = router;
