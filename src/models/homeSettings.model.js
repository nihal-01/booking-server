const { Schema, model } = require("mongoose");

const homeSettingsSchema = new Schema(
    {
        settingsNumber: {
            type: Number,
            required: true,
            default: 1,
            unique: 1,
        },
        logo: {
            type: String,
            required: true,
        },
        phoneNumber1: {
            type: String,
        },
        phoneNumber2: {
            type: String,
        },
        email: {
            type: String,
        },
        facebookUrl: {
            type: String,
        },
        instagramUrl: {
            type: String,
        },
        heroImages: {
            type: [{ type: String, required: true }],
        },
        heroTitle: {
            type: String,
        },
        heroDescription: {
            type: String,
        },
        cards: {
            type: [
                {
                    title: {
                        type: String,
                        required: true,
                    },
                    description: {
                        type: String,
                        required: true,
                    },
                    backgroundImage: {
                        type: String,
                        required: true,
                    },
                    tag: {
                        type: String,
                    },
                    icon: {
                        type: String,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                    isRelativeUrl: {
                        type: Boolean,
                        required: true,
                    },
                },
            ],
        },
        isBestSellingAttractionsSectionEnabled: {
            type: Boolean,
            required: true,
            default: true,
        },
        bestSellingAttractions: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Attraction",
                    required: true,
                },
            ],
        },
        isTopAttractionsSectionEnabled: {
            type: Boolean,
            required: true,
            default: true,
        },
        topAttractions: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Attraction",
                    required: true,
                },
            ],
        },
        isBlogsEnabled: {
            type: Boolean,
            required: true,
            default: true,
        },
        footer: {
            type: [
                {
                    title: {
                        type: String,
                        required: true,
                    },
                    navLinks: [
                        {
                            name: {
                                type: String,
                                required: true,
                            },
                            link: {
                                type: String,
                                required: true,
                            },
                            isRelativeUrl: {
                                type: Boolean,
                                required: true,
                            },
                        },
                    ],
                },
            ],
        },
        footerDescription: {
            type: String,
        },
    },
    { timestamps: true }
);

const HomeSettings = model("Home", homeSettingsSchema);

module.exports = HomeSettings;
