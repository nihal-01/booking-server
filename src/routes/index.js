const homeRouter = require("./homeRouter");
const usersRouter = require("./usersRouter");
const attractionsRouter = require("./attractionsRouter");
const subscribersRouter = require("./subscribersRouter");
const attractionReviewsRouter = require("./attractionReviewsRouter");
const countriesRouter = require("./countriesRouter");
const blogsRouter = require("./blogsRouter");
const attractionsCategoriesRouter = require("./attractionsCategoriesRouter");
const attractionsOrdersRouter = require("./attractionsOrdersRouter");
const transactionRoute = require("./transationRouter");

module.exports = {
    homeRouter,
    usersRouter,
    attractionsRouter,
    subscribersRouter,
    transactionRoute,
    attractionReviewsRouter,
    countriesRouter,
    blogsRouter,
    attractionsCategoriesRouter,
    attractionsOrdersRouter,
};
