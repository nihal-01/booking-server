const { Schema, model } = require("mongoose");

const hotelSeasonSchema = new Schema(
    {
        hotel: {
            type: Schema.Types.ObjectId,
            ref: "Hotel",
            required: true,
        },
        seasonName: {
            type: String,
            required: true,
        },
        fromDate: {
            type: Number,
            required: true,
        },
        toDate: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const HotelSeason = model("HotelSeason", hotelSeasonSchema);

module.exports = HotelSeason;
