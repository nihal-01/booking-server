const { Schema, model } = require("mongoose");

const tourReviewSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            validate: {
                validator: function (v) {
                    return v <= 5 && v >= 1;
                },
                message: () => "Rating should be between 5 and 1",
            },
        },
        tourId: {
            type: Schema.Types.ObjectId,
            ref: "Tour",
            required: true,
        },
    },
    { timestamps: true }
);

const TourReview = model("TourReview", tourReviewSchema);

module.exports = TourReview;
