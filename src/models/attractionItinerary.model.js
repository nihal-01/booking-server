const { Schema, model } = require("mongoose");

const attractionItinerarySchema = new Schema(
    {
        clientName: {
            type: String,
            required: true,
        },
        clientEmail: {
            type: String,
            required: true,
        },
        clientMobileNumber: {
            type: String,
        },
        title: {
            type: String,
            required: true,
        },
        subTitle: {
            type: String,
        },
        // noOfNights: {
        //     type: Number,
        //     required: true,
        // },
        // noOfDays: {
        //     type: Number,
        //     required: true,
        // },
        itineraries: {
            type: [
                {
                    items: {
                        type: [
                            {
                                attraction: {
                                    type: Schema.Types.ObjectId,
                                    ref: "Attraction",
                                    required: true,
                                },
                                activity: {
                                    type: Schema.Types.ObjectId,
                                    ref: "AttractionActivity",
                                    required: true,
                                },
                                itineraryTitle: {
                                    type: String,
                                    required: true,
                                },
                            },
                        ],
                    },
                },
            ],
        },
    },
    { timestamps: true }
);

const AttractionItinerary = model(
    "AttractionItinerary",
    attractionItinerarySchema
);

module.exports = AttractionItinerary;
