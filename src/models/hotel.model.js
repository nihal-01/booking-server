const { Schema, model } = require("mongoose");

const hotelSchema = new Schema({
    hotelName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    place: {
        type: String,
        required: true,
    },
    destination: {
        type: Schema.Types.ObjectId,
        ref: "Hotel",
        required: true,
    },
    country: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    geoCode: {
        longitude: {
            type: String,
            required: true,
        },
        latitude: {
            type: String,
            required: true,
        },
    },
    description: {
        type: String,
        required: true,
    },
    faq: {
        type: [
            {
                question: {
                    type: String,
                    required: true,
                },
                answer: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
    checkInTime: {
        type: String,
        required: true,
    },
    checkOutTime: {
        type: String,
        required: true,
    },
    isAgeRestrictions: {
        type: Boolean,
        required: true,
    },
    isPetsAllowed: {
        type: Boolean,
        required: true
    },
    // isCashAllowed
    // facilities: {
    //     type: String,
    //     required: true,
    // },
});

const Hotel = model("Hotel", hotelSchema);

module.exports = Hotel;
