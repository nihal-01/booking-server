const { Schema, model } = require("mongoose");

const roomTypeSchema = new Schema(
    {
        hotel: {
            type: Schema.Types.ObjectId,
            ref: "Hotel",
            required: true,
        },
        roomName: {
            type: String,
            required: true,
        },
        roomOccupancy: {
            type: String,
            required: true,
            uppercase: true,
            enum: ["DBL", "SGL", "TPL", "CWB", "CNB"],
        },
        facilities: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "HotelFacility",
                    required: true,
                },
            ],
            default: [],
        },
        noOfSleeps: {
            type: Number,
            required: true,
        },
        isRefundable: {
            type: Boolean,
            required: true,
        },
        isBreakFastIncluded: {
            type: Boolean,
            required: true,
        },
        area: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const RoomType = model("RoomType", roomTypeSchema);

module.exports = RoomType;
