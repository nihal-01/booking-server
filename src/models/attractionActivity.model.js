const { Schema, model } = require("mongoose");

const attractionActivitySchema = new Schema(
    {
        attraction: {
            type: Schema.Types.ObjectId,
            ref: "Attraction",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        facilities: {
            type: String,
            required: true,
        },
        adultAgeLimit: {
            type: Number,
            required: true,
        },
        adultPrice: {
            type: Number,
            required: true,
        },
        childAgeLimit: {
            type: Number,
            required: true,
        },
        childPrice: {
            type: Number,
            required: true,
        },
        infantAgeLimit: {
            type: Number,
            required: true,
        },
        infantPrice: {
            type: Number,
        },
        isVat: {
            type: Boolean,
            required: true,
        },
        vat: {
            type: Number,
            required: function () {
                return this.isVat === true;
            },
        },
        base: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["person", "private", "hourly"],
        },
        isTransferAvailable: {
            type: Boolean,
            required: true,
        },
        privateTransferPrice: {
            type: Number,
        },
        sharedTransferPrice: {
            type: Number,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        peakTime: {
            type: Date,
        },
        note: {
            type: String,
        },
    },
    { timestamps: true }
);

const AttractionActivity = model(
    "AttractionActivity",
    attractionActivitySchema
);

module.exports = AttractionActivity;
