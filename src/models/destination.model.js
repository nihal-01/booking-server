const { Schema, model } = require("mongoose");

const destinationSchema = new Schema(
    {
        country: {
            type: Schema.Types.ObjectId,
            reef: "CCountry",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Destination = model("Destination", destinationSchema);

module.exports = Destination;
