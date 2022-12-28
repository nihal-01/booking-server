const router = require("express").Router();

const { adminAuth } = require("./middlewares");
const {
    admAuthRouter,
    admHomeRouter,
    admAttractionCategoriesRouter,
    admAttractionsRouter,
    admBlogsRouter,
    admBlogCategoriesRouter,
    admSubscribersRouter,
    admAttractionsTicketsRouter,
} = require("./routes");

router.use("/auth", admAuthRouter);

router.use(adminAuth);

router.use("/attractions/categories", admAttractionCategoriesRouter);
router.use("/attractions/tickets", admAttractionsTicketsRouter);
router.use("/attractions", admAttractionsRouter);
router.use("/home", admHomeRouter);
router.use("/blogs/categories", admBlogCategoriesRouter);
router.use("/blogs", admBlogsRouter);
router.use("/subscribers", admSubscribersRouter);

module.exports = router;
