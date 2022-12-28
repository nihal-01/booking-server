const router = require("express").Router();

const {
    addCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
} = require("../controllers/admBlogCategoriesController");

router.post("/add", addCategory);
router.get("/all", getAllCategories);
router.patch("/update/:id", updateCategory);
router.delete("/delete/:id", deleteCategory);

module.exports = router;
