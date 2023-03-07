const { Schema, model } = require("mongoose");

const hotelAllocationSchema = new Schema(
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
        season: {
            type: Schema.Types.ObjectId,
            ref: "HotelSeason",
            required: true,
        },
        allocation: {
            type: Number,
            required: true,
        },
        release: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const HotelAllocation = model("HotelAllocation", hotelAllocationSchema);

module.exports = HotelAllocation;
