const { Schema, model } = require("mongoose");

const hotelLegendSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        color: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const HotelLegend = model("HotelLegend", hotelLegendSchema);

module.exports = HotelLegend;
