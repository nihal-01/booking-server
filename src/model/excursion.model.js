const { Schema, model } = require("mongoose");

const excursionSchema = new Schema(
    {
        excursionName: {
            type: String,
            required: true,
        },
        adultPrice: {
            type: Number,
            required: true,
        },
        childPrice: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const Excursion = model("Excursion", excursionSchema);

module.exports = Excursion;
