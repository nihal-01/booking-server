const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/dbConfig");

const adminRouter = require("./admin");
const { homeRouter } = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use("/public", express.static("public"));

app.use("/api/v1/home", homeRouter);

// ADMIN ROUTE
app.use("/api/v1/admin", adminRouter);

app.listen(PORT, () => {
    console.log(`server is up and running on port ${PORT}`);
});
