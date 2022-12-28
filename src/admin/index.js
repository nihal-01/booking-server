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
    admCountriesRouter,
    admDestinationsRouter,
} = require("./routes");

router.use("/auth", admAuthRouter);
router.use("/attractions/tickets", admAttractionsTicketsRouter);

router.use(adminAuth);

router.use("/attractions/categories", admAttractionCategoriesRouter);
router.use("/attractions", admAttractionsRouter);
router.use("/home", admHomeRouter);
router.use("/blogs/categories", admBlogCategoriesRouter);
router.use("/blogs", admBlogsRouter);
router.use("/subscribers", admSubscribersRouter);
router.use("/countries", admCountriesRouter);
router.use("/destinations", admDestinationsRouter);

module.exports = router;
