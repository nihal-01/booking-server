const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/dbConfig");

const adminRouter = require("./admin");
const b2bRoute = require('./b2b')

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
    transactionRoute
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
app.use("/api/v1/transation",transactionRoute);


app.post("/webhook", (req, res) => {
    console.log(req);
});

// ADMIN ROUTE
app.use("/api/v1/admin", adminRouter);


//RESELLER ROUTES
app.use("/api/v1/b2b",b2bRoute );



// app.use("/api/v1/reseller", );


app.listen(PORT, () => {
    console.log(`server is up and running on port ${PORT}`);
});
