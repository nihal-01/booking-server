const { Schema, model } = require("mongoose");

const b2bClientFlightSchema = new Schema(
    {
        markupType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["flat", "percentage"],
        },
        markup: {
            type: Number,
            required: true,
        },
        airline: {
            type: Schema.Types.ObjectId,
            ref: "Airline",
            required: true,
        },
        resellerId: {
            type: Schema.Types.ObjectId,
            ref: "Reseller",
            required: true,
        },
    },
    { timestamps: true }
);

const B2BClientFlightMarkup = model(
    "B2BClientFlightMarkup",
    b2bClientFlightSchema
);

module.exports = B2BClientFlightMarkup;
