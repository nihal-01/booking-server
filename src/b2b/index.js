const router = require("express").Router();

const { b2bResellersAuthRouter, b2bResellersRouter, b2bClientAttractionRouter ,b2bClientAttractionMarkupRouter ,b2bSubAgentAttractionMarkupRouter } = require("./routes");

router.use("/resellers/auth", b2bResellersAuthRouter);
router.use("/resellers", b2bResellersRouter);
router.use('/resellers/client/attraction' , b2bClientAttractionRouter)
router.use('/resellers/client/markup' , b2bClientAttractionMarkupRouter)
router.use('/resellers/subagent/markup' , b2bSubAgentAttractionMarkupRouter)



module.exports = router;
