const { Schema, model } = require("mongoose");

const driverSchema = new Schema(
    {
        driverName: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    { timestamps: true }
);

const Driver = model("Driver", driverSchema);

module.exports = Driver;
