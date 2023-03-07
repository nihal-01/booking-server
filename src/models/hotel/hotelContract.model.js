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
        contractType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["free-sale", "stop-sale", "contracted-rates"],
        },
        price: {
            type: Number,
            required: function () {
                return this.contractType !== "stop-sale"
            },
        },
        // isRoPriceAvailable: {
        //     type: Boolean,
        //     required: true,
        // },
        // roPrice: {
        //     type: Number,
        //     required: function () {
        //         return (
        //             this.contractType !== "stop-sale" &&
        //             this.isRoPriceAvailable === true
        //         );
        //     },
        // },
        // isBbPriceAvailable: {
        //     type: Boolean,
        //     required: true,
        // },
        // bbPrice: {
        //     type: Number,
        //     required: function () {
        //         return (
        //             this.contractType !== "stop-sale" &&
        //             this.isBbPriceAvailable === true
        //         );
        //     },
        // },
        // isNewUpdate: {
        //     type: Boolean,
        //     required: true,
        // },
        // extraAdultPrice: {
        //     type: Number,
        //     required: true,
        //     default: 0,
        // },
        // isBreakfastIncludedInExtraAdultPrice: {
        //     type: Boolean,
        //     required: true,
        // },
    },
    { timestamps: true }
);

const HotelContract = model("HotelContract", hotelContractSchema);

module.exports = HotelContract;
