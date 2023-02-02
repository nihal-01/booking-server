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
    admEmailSettingsRouter,
    admTransactionsRouter,
    admEmailServicesRouter,
    admEmailsRouter,
    admPaymentServicesRouter,
    admOtpSettingsRouter,
    admVisaRouter,
    admVisaApplicationRouter,
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
router.use("/email-services", admEmailServicesRouter);
router.use("/emails", admEmailsRouter);
router.use("/transactions", admTransactionsRouter);
router.use("/payment-services", admPaymentServicesRouter);
router.use("/email-settings", admEmailSettingsRouter);
router.use("/otp-settings", admOtpSettingsRouter);
router.use("/visa" , admVisaRouter)
router.use('/visa/application' , admVisaApplicationRouter)

module.exports = router;
