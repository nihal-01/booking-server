const mongoose = require("mongoose");

const mongoUrl = process.env.MONGODB_URL;

mongoose.connect(mongoUrl, (error) => {
    if (!error) {
        console.log("database connection established successfully");
    } else {
        console.log(error);
    }
});
