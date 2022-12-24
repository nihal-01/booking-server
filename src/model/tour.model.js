const { Schema, model } = require("mongoose");

const tourSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        youtubeLink: {
            type: String,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        pickupAndDrop: {
            type: String,
            enum: ["yes", "no"],
        },
        instantConfirmation: {
            type: String,
            required: true,
            enum: ["yes", "no"],
        },
        isFreeCancellationAvailable: {
            type: Boolean,
            required: true,
        },
        freeCancellationTime: {
            type: Number,
            required: function () {
                return this.isFreeCancellationAvailable === true;
            },
            enum: [24, 48, 72],
        },
        images: {
            type: [{ type: String, required: true }],
        },
        tourOverView: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Tour = model("Tour", tourSchema);

module.exports = Tour;
