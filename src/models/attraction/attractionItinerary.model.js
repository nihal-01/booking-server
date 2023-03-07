const { Schema, model } = require("mongoose");

const attractionItinerarySchema = new Schema(
    {
        agentName: {
            type: String,
            required: true,
        },
        agentEmail: {
            type: String,
            required: true,
        },
        agentMobileNumber: {
            type: String,
        },
        queryDetails: {
            type: String,
            required: true,
        },
        referenceNo: {
            type: String,
            required: true,
        },
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
                                },
                                note: {
                                    type: String,
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
