const { Schema, model } = require("mongoose");

const hotelOfferSchema = new Schema({});

const HotelOffer = model("HotelOffer", hotelOfferSchema);

module.exports = HotelOffer;
