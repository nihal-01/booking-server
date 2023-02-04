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
        inclusions: {
            type: [
                {
                    type: String,
                    required: true,
                },
            ],
        },
        noOfSleeps: {
            type: Number,
            required: true,
        },
        isRefundable: {
            type: Boolean,
            required: true,
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
