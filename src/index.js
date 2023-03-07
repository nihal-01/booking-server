const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../" + `.env.${process.env.NODE_ENV}`),
});

require("./config/dbConfig");
require("./config/cache");

const adminRouter = require("./admin");
const b2bRouter = require("./b2b");
const {
    homeRouter,
    usersRouter,
    attractionsRouter,
    subscribersRouter,
    attractionReviewsRouter,
    countriesRouter,
    blogsRouter,
    attractionsCategoriesRouter,
    attractionsOrdersRouter,
    visaListRouter,
    visaApplicationRouter,
    searchListRouter,
} = require("./routes");
 
const app = express();
const PORT = process.env.PORT || 8189;

app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(cors());
app.use("/public", express.static("public"));

app.use("/api/v1/home", homeRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/attractions/reviews", attractionReviewsRouter);
app.use("/api/v1/attractions/categories", attractionsCategoriesRouter);
app.use("/api/v1/attractions/orders", attractionsOrdersRouter);
app.use("/api/v1/attractions", attractionsRouter);
app.use("/api/v1/subscribers", subscribersRouter);
app.use("/api/v1/countries", countriesRouter);
app.use("/api/v1/blogs", blogsRouter);
app.use("/api/v1/search", searchListRouter);

app.use("/api/v1/visa", visaListRouter);
app.use("/api/v1/visa/application", visaApplicationRouter);

// ADMIN ROUTE
app.use("/api/v1/admin", adminRouter);

// B2B Route
app.use("/api/v1/b2b", b2bRouter);

app.listen(PORT, () => {
    console.log(`running ${process.env.NODE_ENV} server....`)
    console.log(`server is up and running on port ${PORT}`);
});
