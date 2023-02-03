const { Schema, model } = require("mongoose");

const hotelSchema = new Schema(
    {
        isPublished: {
            type: Boolean,
            required: true,
            default: false,
        },
        hotelName: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: function () {
                return this.isPublished === true;
            },
        },
        place: {
            type: String,
            required: true,
        },
        destination: {
            type: Schema.Types.ObjectId,
            ref: "Destination",
            required: function () {
                return this.isPublished === true;
            },
        },
        country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: function () {
                return this.isPublished === true;
            },
        },
        geoCode: {
            longitude: {
                type: String,
                required: function () {
                    return this.isPublished === true;
                },
            },
            latitude: {
                type: String,
                required: function () {
                    return this.isPublished === true;
                },
            },
        },
        description: {
            type: String,
            required: function () {
                return this.isPublished === true;
            },
        },
        faqs: {
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
            required: function () {
                return this.isPublished === true;
            },
        },
        checkOutTime: {
            type: String,
            required: function () {
                return this.isPublished === true;
            },
        },
        isAgeRestriction: {
            type: Boolean,
            required: function () {
                return this.isPublished === true;
            },
        },
        isPetsAllowed: {
            type: Boolean,
            required: function () {
                return this.isPublished === true;
            },
        },
        isCashAllowedOnly: {
            type: Boolean,
            required: function () {
                return this.isPublished === true;
            },
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
        website: {
            type: String,
        },
        starCategory: {
            type: String,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            required: true,
            default: false,
        },
        roomsCount: { type: Number },
        floorsCount: { type: Number },
        carParkingSlots: { type: Number },
        images: {
            type: [{ type: String, required: true }],
        },
    },
    { timestamps: true }
);

const Hotel = model("Hotel", hotelSchema);

module.exports = Hotel;
