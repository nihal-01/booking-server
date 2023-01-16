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
    admCurrenciesRouter,
    admB2cAttractionMarkupRouter,
    admResellersRouter,
<<<<<<< HEAD
=======
    admEmailSettingsRouter,
    admTransactionsRouter,
>>>>>>> 83dc796ba5af883e0c7fd7cc4d14457f511ea005
} = require("./routes");

router.use("/auth", admAuthRouter);

router.use(adminAuth);

router.use("/attractions/tickets", admAttractionsTicketsRouter);
router.use("/attractions/categories", admAttractionCategoriesRouter);
router.use("/attractions/orders", admAttractionsOrdersRouter);
router.use("/attractions/b2c/markups", admB2cAttractionMarkupRouter);
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
router.use("/currencies", admCurrenciesRouter);
router.use("/resellers", admResellersRouter);
<<<<<<< HEAD
=======
router.use("/email-settings", admEmailSettingsRouter);
router.use("/transactions", admTransactionsRouter);
>>>>>>> 83dc796ba5af883e0c7fd7cc4d14457f511ea005

module.exports = router;
