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
        season: {
            type: Schema.Types.ObjectId,
            ref: "HotelSeason",
            required: true,
        },
        // contractType: {
        //     type: String,
        //     required: true,
        //     lowercase: true,
        //     enum: ["free-sale", "stop-sale", "contracted-rates"],
        // },
        price: {
            type: Number,
            required: true,
        },
        bbPrice: {
            type: Number,
            required: true, // add is Bb
        },
    },
    { timestamps: true }
);

const HotelContract = model("HotelContract", hotelContractSchema);

module.exports = HotelContract;