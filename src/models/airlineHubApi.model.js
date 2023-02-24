const { Schema, model } = require("mongoose");

const airlineHubSchema = new Schema(
    {
        airline: {
            type: Schema.Types.ObjectId,
            ref: "Airline",
            required: true,
        },
        hubName: {
            type: String,
            required: true,
        },
        hubPlace: {
            type: String,
        },
        api: {
            type: Schema.Types.ObjectId,
            ref: "ApiMaster",
            required: true,
        },
    },
    { timestamps: true }
);

const AirlineHub = model("AirlineHub", airlineHubSchema);

module.exports = AirlineHub;
