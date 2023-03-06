const { Schema, model } = require("mongoose");

const b2bSubAgentFlightMarkupSchema = new Schema(
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
        airLine: {
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

const B2BSubAgentFlightMarkup = model(
    "B2BSubAgentFlightMarkup",
    b2bSubAgentFlightMarkupSchema
);

module.exports = B2BSubAgentFlightMarkup;
