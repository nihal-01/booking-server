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
    admGeneralRouter,
    admUsersRouter,
    admAttractionsOrdersRouter,
    admDriversRouter,
} = require("./routes");

router.use("/auth", admAuthRouter);

router.use(adminAuth);

router.use("/attractions/tickets", admAttractionsTicketsRouter);
router.use("/attractions/categories", admAttractionCategoriesRouter);
router.use("/attractions/orders", admAttractionsOrdersRouter);
router.use("/attractions", admAttractionsRouter);
router.use("/home", admHomeRouter);
router.use("/blogs/categories", admBlogCategoriesRouter);
router.use("/blogs", admBlogsRouter);
router.use("/subscribers", admSubscribersRouter);
router.use("/countries", admCountriesRouter);
router.use("/destinations", admDestinationsRouter);
router.use("/general", admGeneralRouter);
router.use("/users", admUsersRouter);
router.use("/users", admUsersRouter);
router.use("/drivers", admDriversRouter);

module.exports = router;
