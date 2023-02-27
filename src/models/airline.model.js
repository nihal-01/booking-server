const { Schema, model } = require("mongoose");

const airlineSchema = new Schema(
    {
        airlineName: {
            type: String,
            required: true,
        },
        airlineCode: {
            type: Number,
            required: true,
        },
        iataCode: {
            type: String,
            required: true,
            uppercase: true,
            unique: true,
        },
        icaoCode: {
            type: String,
            required: true,
            uppercase: true,
            unique: true,
        },
        image: {
            type: String,
            required: true,
        },
        api: {
            type: Schema.Types.ObjectId,
            ref: "ApiMaster",
            required: true,
        },
        isActive: {
            type: Boolean,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true }
);

const Airline = model("Airline", airlineSchema);

module.exports = Airline;
