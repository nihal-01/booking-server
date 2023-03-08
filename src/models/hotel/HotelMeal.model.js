const { Schema, model } = require("mongoose");

const hotelMealSchema = new Schema({});

const HotelMeal = model("HotelMeal", hotelMealSchema);

module.exports = HotelMeal;
