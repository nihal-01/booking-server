const { Schema, model } = require("mongoose");

const visaTypeSchema = new Schema(
    {
        visa: {
            type: Schema.Types.ObjectId,
            ref: "Visa",
            required: true,
        },
        visaName: {
            type: String,
            required: true,
        },
        processingTimeFormat: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["hours", "days", "months"],
        },
        processingTime: {
            type: Number,
            required: true,
        },
        stayPeriodFormat: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["hours", "days", "months"],
        },
        stayPeriod: {
            type: Number,
            required: true,
        },
        validityTimeFormat: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["hours", "days", "months"],
        },
        validity: {
            type: Number,
            required: true,
        },
        entryType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["single", "multiple"],
        },
        tax: {
            type: Number,
            required: true,
        },
        serviceCharge: {
            type: Number,
            required: true,
        },
        purchaseCost: {
            type: Number,
            required: true,
        },
        visaPrice: {
            type: Number,
            required: true,
        },
        ageFrom: {
            type: Number,
            required: true,
        },
        ageTo: {
            type: Number,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

const VisaType = model("VisaType", visaTypeSchema);

module.exports = VisaType;
