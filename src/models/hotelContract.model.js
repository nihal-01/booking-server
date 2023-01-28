const { Schema, model } = require("mongoose");

const hotelContractSchema = new Schema(
    {
        hotel: {
            type: Schema.Types.ObjectId,
            ref: "Hotel",
            required: true,
        },
        roomType: {
            type: Schema.Types.ObjectId,
            ref: "RoomType",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        contractType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["free-sale", "stop-sale", "contracted-rates"],
        },
        isNewUpdate: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true }
);

const HotelContract = model("HotelContract", hotelContractSchema);

module.exports = HotelContract;
