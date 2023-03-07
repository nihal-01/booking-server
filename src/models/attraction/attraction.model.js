const { Schema, model } = require("mongoose");

const attractionSchema = new Schema(
    {
        destination: {
            type: Schema.Types.ObjectId,
            ref: "Destination",
            required: true,
        },
        logo: {
            type: String,
        },
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
        bookingPriorDays: {
            type: Number,
            required: function () {
                return this.bookingType === "booking";
            },
        },
        isCustomDate: {
            type: Boolean,
            required: true,
        },
        startDate: {
            type: Date,
            required: function () {
                return this.isCustomDate === true;
            },
        },
        endDate: {
            type: Date,
            required: function () {
                return this.isCustomDate === true;
            },
        },
        availability: {
            type: [
                {
                    isEnabled: {
                        type: Boolean,
                        required: true,
                    },
                    day: {
                        type: String,
                        lowercase: true,
                        required: true,
                    },
                    open: {
                        type: String,
                        required: function () {
                            return this.isEnabled === true;
                        },
                    },
                    close: {
                        type: String,
                        required: function () {
                            return this.isEnabled === true;
                        },
                    },
                },
            ],
        },
        offDates: {
            type: [
                {
                    from: {
                        type: Date,
                        required: true,
                    },
                    to: {
                        type: Date,
                        required: true,
                    },
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
            type: Number,
            required: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        mapLink: {
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
        highlights: {
            type: String,
            required: true,
        },
        itineraryDescription: {
            type: String,
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
        isApiConnected: {
            type: Boolean,
            required: true,
        },
        connectedApi: {
            type: Schema.Types.ObjectId,
            required: function () {
                return this.isApiConnected === true;
            },
        },
        cancellationType: {
            type: String,
            required: true,
            enum: ["nonRefundable", "freeCancellation", "cancelWithFee"],
        },
        cancelBeforeTime: {
            type: Number,
            required: function () {
                return (
                    this.cancellationType === "freeCancellation" ||
                    this.cancellationType === "cancelWithFee"
                );
            },
        },
        cancellationFee: {
            type: Number,
            required: function () {
                return this.cancellationType === "cancelWithFee";
            },
        },
        isDeleted: {
            type: Boolean,
            required: true,
            default: false,
        },
        isCombo: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true }
);

attractionSchema.virtual("activities", {
    ref: "AttractionActivity",
    localField: "_id",
    foreignField: "attraction",
});

const Attraction = model("Attraction", attractionSchema);

module.exports = Attraction;
