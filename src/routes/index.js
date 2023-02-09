const homeRouter = require("./homeRouter");
const usersRouter = require("./usersRouter");
const attractionsRouter = require("./attractionsRouter");
const subscribersRouter = require("./subscribersRouter");
const attractionReviewsRouter = require("./attractionReviewsRouter");
const countriesRouter = require("./countriesRouter");
const blogsRouter = require("./blogsRouter");
const attractionsCategoriesRouter = require("./attractionsCategoriesRouter");
const attractionsOrdersRouter = require("./attractionsOrdersRouter");
const visaApplicationRouter = require('./visaApplicationRouter')
const visaListRouter = require('./visaListRouter')
const searchListRouter = require('./searchListRouter')

module.exports = {
    homeRouter,
    usersRouter,
    attractionsRouter,
    subscribersRouter,
    attractionReviewsRouter,
    countriesRouter,
    blogsRouter,
    attractionsCategoriesRouter,
    attractionsOrdersRouter,
    visaApplicationRouter,
    visaListRouter,
    searchListRouter
};
