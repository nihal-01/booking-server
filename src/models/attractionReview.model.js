const { Schema, model } = require("mongoose");

const attractionReviewSchema = new Schema(
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
        attraction: {
            type: Schema.Types.ObjectId,
            ref: "Attraction",
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const AttractionReview = model("AttractionReview", attractionReviewSchema);

module.exports = AttractionReview;
