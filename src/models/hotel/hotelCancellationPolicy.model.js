const { Schema, model } = require("mongoose");

const hotelCancellationSchema = new Schema(
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
        nightsPriorToCheckIn: {
            type: Number,
            required: true,
        },
        cancellationChargeType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["flat", "percentage"],
        },
        cancellationCharge: {
            type: Number,
            required: true,
        },
        cancellationNights: {
            // not confirmed
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const HotelCancellation = model("HotelCancellation", hotelCancellationSchema);

module.exports = HotelCancellation;
