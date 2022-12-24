const router = require("express").Router();

const { adminAuth } = require("./middlewares");
const {
    admCategoriesRouter,
    admAuthRouter,
    admHomeRouter,
} = require("./routes");

router.use("/auth", admAuthRouter);

router.use(adminAuth);

router.use("/categories", admCategoriesRouter);
router.use("/home", admHomeRouter);

module.exports = router;
