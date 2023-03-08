const { Schema, model } = require("mongoose");

const hotelMlosSchema = new Schema(
    {
        hotel: {
            type: Schema.Types.ObjectId,
            ref: "Hotel",
            required: true,
        },
        roomType: {
            type: String,
            required: true,
            enum: [Schema.Types.ObjectId, "all"],
        },
        legend: {
            type: String,
            required: true,
            // enum: ["contracted", "sale"]
        },
        season: {
            type: Schema.Types.ObjectId,
            ref: "HotelSeason",
            required: true,
        },
        minimumNights: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const HotelMlos = model("HotelMlos", hotelMlosSchema);

module.exports = HotelMlos;
