const { Schema, model } = require("mongoose");

const hotelEventSchema = new Schema({
    
}, { timestamps: true });

const HotelEvent = model("HotelEvent", hotelEventSchema);

module.exports = HotelEvent;
