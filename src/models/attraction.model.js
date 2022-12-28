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
        bookingType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["booking", "ticket"],
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        offDays: {
            type: [
                {
                    type: Date,
                    required: true,
                },
            ],
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
