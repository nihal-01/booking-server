const { Schema, model } = require("mongoose");

const destinationSchema = new Schema(
    {
        country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: true,
        },
        name: {
            type: String,
            lowercase: true,
            trim: true,
            required: true,
        },
    },
    { timestamps: true }
);

const Destination = model("Destination", destinationSchema);

module.exports = Destination;
