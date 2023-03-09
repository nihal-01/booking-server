const { Schema, model } = require("mongoose");

const hotelRateSchema = new Schema(
    {
        roomType: {
            type: Schema.Types.ObjectId,
            ref: "RoomType",
            required: true,
        },
        badge: {
            type: Schema.Types.ObjectId,
            ref: "HotelBadge",
            required: true,
        },
        isCustomDate: {
            type: Boolean,
            rquired: true,
        },
        season: {
            type: Schema.Type.ObjectId,
            ref: "HotelSeason",
            required: function () {
                return this.isCustomDate !== true;
            },
        },
        from: {
            type: Date,
            required: function () {
                return this.isCustomDate === true;
            }
        },
        to: {
            type: Date,
            required: function () {
                return this.isCustomDate === true;
            }
        },
        price: {
            type: Map,
            of: String,
        },
    },
    { timestamps: true }
);

const HotelRate = model("HotelRate", hotelRateSchema);

module.exports = HotelRate;
