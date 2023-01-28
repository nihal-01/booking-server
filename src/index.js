const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/cache");
require("./config/dbConfig");

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
} = require("./routes");

const app = express();
const PORT = process.env.PORT || 8089;

app.use(express.json());
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

// ADMIN ROUTE
app.use("/api/v1/admin", adminRouter);

// B2B Route
app.use("/api/v1/b2b", b2bRouter);

app.listen(PORT, () => {
    console.log(`server is up and running on port ${PORT}`);
});
