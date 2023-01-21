const mongoose = require("mongoose");
const redisClient = require("redis").createClient;
const redis = redisClient(6379, "localhost");

const mongoUrl = process.env.MONGODB_URL;

mongoose.connect(mongoUrl, (error) => {
    if (!error) {
        console.log("database connection established successfully");
    } else {
        console.log(error);
    }
});

redis.on("connect", () => {
    console.log('connected to Redis');
});
