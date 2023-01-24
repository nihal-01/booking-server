const router = require("express").Router();

const { b2bResellersAuthRouter,b2bAttractionOrdersRouter, b2bResellersRouter, b2bClientAttractionRouter ,b2bClientAttractionMarkupRouter ,b2bSubAgentAttractionMarkupRouter, b2bWalletDepositRouter } = require("./routes");

router.use("/resellers/auth", b2bResellersAuthRouter);
router.use("/resellers", b2bResellersRouter);
router.use('/resellers/client/attraction' , b2bClientAttractionRouter)
router.use('/resellers/client/markup' , b2bClientAttractionMarkupRouter)
router.use('/resellers/subagent/markup' , b2bSubAgentAttractionMarkupRouter)
router.use('/resellers/wallet' , b2bWalletDepositRouter)
router.use('/reseller/attraction/orders' ,   b2bAttractionOrdersRouter)





module.exports = router;
