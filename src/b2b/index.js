const router = require("express").Router();

const {
    b2bResellersAuthRouter,
    b2bAttractionOrdersRouter,
    b2bResellersRouter,
    b2bClientAttractionRouter,
    b2bClientAttractionMarkupRouter,
    b2bSubAgentAttractionMarkupRouter,
    b2bWalletDepositRouter,
    b2bTransactionRouter,
    b2bClientVisaMarkupRouter,
    b2bSubAgentVisaMarkupRouter,
    b2bVisaRouter,
    b2bVisaApplicationListRouter,
    b2bVisaListRouter,
    b2bAttractionTicketsRouter,
} = require("./routes");

router.use("/resellers/auth", b2bResellersAuthRouter);
router.use("/resellers", b2bResellersRouter);
router.use("/resellers/client/attraction", b2bClientAttractionRouter);
router.use("/resellers/client/markup", b2bClientAttractionMarkupRouter);
router.use("/resellers/subagent/markup", b2bSubAgentAttractionMarkupRouter);
router.use("/resellers/client/markup", b2bClientAttractionMarkupRouter);
router.use("/resellers/subagent/markup", b2bSubAgentAttractionMarkupRouter);
router.use("/resellers/wallet", b2bWalletDepositRouter);
router.use("/attractions/orders", b2bAttractionOrdersRouter);
router.use("/attractions/tickets", b2bAttractionTicketsRouter);
router.use("/transactions", b2bTransactionRouter);
router.use("/subagent/visa/markup", b2bSubAgentVisaMarkupRouter);
router.use("/client/visa/markup", b2bClientVisaMarkupRouter);
router.use("/visa", b2bVisaListRouter);
router.use("/visa/application", b2bVisaRouter);
router.use("/visa/application/list", b2bVisaApplicationListRouter);

module.exports = router;
