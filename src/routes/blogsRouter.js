const router = require("express").Router();

const {
    getAllBlogs,
    getBlogsCategoriesAndTags,
    getSingleBlog,
} = require("../controllers/blogsController");

router.get("/all", getAllBlogs);
router.get("/categories-tags", getBlogsCategoriesAndTags);
router.get("/single/:slug", getSingleBlog);

module.exports = router;
