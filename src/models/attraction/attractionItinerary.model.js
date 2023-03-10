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
                                isCustom: {
                                    type: Boolean,
                                    required: true,
                                    default: false,
                                },
                                attraction: {
                                    type: Schema.Types.ObjectId,
                                    ref: "Attraction",
                                },
                                activity: {
                                    type: Schema.Types.ObjectId,
                                    ref: "AttractionActivity",
                                },
                                attractionTitle: {
                                    type: String,
                                },
                                activityTitle: {
                                    type: String,
                                },
                                itineraryTitle: {
                                    type: String,
                                },
                                note: {
                                    type: String,
                                },
                                description: {
                                    type: String,
                                },
                                images: {
                                    type: [
                                        {
                                            type: String,
                                        },
                                    ],
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
