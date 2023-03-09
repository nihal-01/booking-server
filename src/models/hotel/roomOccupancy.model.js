const { Schema, model } = require("mongoose");

const roomOccupancySchema = new Schema(
    {
        occupancyName: {
            type: String,
            required: true,
        },
        shortName: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const RoomOccupancy = model("RoomOccupancy", roomOccupancySchema);

module.exports = RoomOccupancy;
