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
        roomOccupancies: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "RoomOccupancy",
                    required: true,
                },
            ],
        },
        inclusions: {
            type: [
                {
                    type: String,
                    required: true,
                },
            ],
        },
        roomCapacity: {
            type: [
                {
                    adult: {
                        type: Number,
                        required: true,
                    },
                    child: {
                        type: Number,
                        required: true,
                    },
                },
            ],
        },
        area: {
            type: Number,
        },
        images: {
            type: [{ type: String, required: true }],
        },
        isDeleted: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

const RoomType = model("RoomType", roomTypeSchema);

module.exports = RoomType;
