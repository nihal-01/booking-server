const { Schema, model } = require("mongoose");

const hotelContractSchema = new Schema({});

const HotelContract = model("HotelContract", hotelContractSchema);

module.exports = HotelContract;
