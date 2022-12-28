const router = require("express").Router();

const {
    getAllBlogs,
    getBlogsCategoriesAndTags,
} = require("../controllers/blogsController");

router.get("/all", getAllBlogs);
router.get("/categories-tags", getBlogsCategoriesAndTags);

module.exports = router;
