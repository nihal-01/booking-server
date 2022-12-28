const { Schema, model } = require("mongoose");

const attractionSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "AttractionCategory",
            required: true,
        },
        availability: {
            type: String,
            required: true,
            enum: ["daily", "monthly", "yearly", "custom"],
        },
        avaialbleDays: {
            type: [
                {
                    type: String,
                    required: true,
                    lowercase: true,
                    enum: [
                        "sunday",
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                    ],
                },
            ],
        },
        startDate: {
            type: Date,
            required: function () {
                return this.availability !== "daily";
            },
        },
        endDate: {
            type: Date,
            required: function () {
                return this.availability !== "daily";
            },
        },
        durationType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["hours", "days", "months"],
        },
        duration: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        latitude: {
            type: String,
        },
        longitude: {
            type: String,
        },
        isOffer: {
            type: Boolean,
            required: true,
        },
        offerAmountType: {
            type: String,
            required: function () {
                return this.offer === true;
            },
            enum: ["flat", "percentage"],
            lowercase: true,
        },
        offerAmount: {
            type: Number,
            required: function () {
                return this.offer === true;
            },
        },
        youtubeLink: {
            type: String,
            required: true,
        },
        images: {
            type: [{ type: String, required: true }],
            required: true,
        },
        sections: {
            type: [
                {
                    title: {
                        type: String,
                        required: true,
                    },
                    body: {
                        type: String,
                        required: true,
                    },
                },
            ],
        },
    },
    { timestamps: true }
);

const Attraction = model("Attraction", attractionSchema);

module.exports = Attraction;
