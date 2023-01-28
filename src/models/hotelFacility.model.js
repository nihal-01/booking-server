const { Schema, model } = require("mongoose");

const hotelFacilitySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const HotelFacility = model("HotelFacility", hotelFacilitySchema);

module.exports = HotelFacility;
