const { Schema, model } = require("mongoose");

const visaApplicationSchema = new Schema(
    {
        visaType: {
            type: Schema.Types.ObjectId,
            ref: "VisaType",
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        contactNo: {
            type: Number,
            required: true,
        },
        isDetailsAdded: {
            type: Boolean,
            required: true,
            default: false,
        },
        onwardDate: {
            type: Date,
            required: function () {
                return this.isDetailsAdded === true;
            },
        },
        returnDate: {
            type: Date,
            required: function () {
                return this.isDetailsAdded === true;
            },
        },
        noOfTravellers: {
            type: Number,
            required: true,
        },
        travellers: {
            type: [
                {
                    title: {
                        type: String,
                        required: true,
                        enum: ["mr", "ms", "mrs", "mstr"],
                        lowercase: true,
                    },
                    firstName: {
                        type: String,
                        required: true,
                    },
                    lastName: {
                        type: String,
                        required: true,
                    },
                    dateOfBirth: {
                        day: {
                            type: Number,
                            required: true,
                        },
                        month: {
                            type: Number,
                            required: true,
                        },
                        year: {
                            type: Number,
                            required: true,
                        },
                    },
                    country: {
                        type: Schema.Types.ObjectId,
                        ref: "Country",
                        required: true,
                    },
                    passportNo: {
                        type: String,
                        required: true,
                    },
                    contactNo: {
                        type: Number,
                        required: true,
                    },
                    email: {
                        type: Number,
                        required: true,
                    },
                },
            ],
        },
        isPayed: {
            type: Boolean,
            required: true,
            default: false,
        },
        isDocumentUplaoded: {
            type: Boolean,
            required: true,
            default: false,
        },
        documents: {
            type: Schema.Types.ObjectId,
            ref: "VisaDocument",
            required: function () {
                return this.isDocumentUplaoded === true;
            },
        },
        status: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["initiated", "submitted", "approved", "cancelled"],
            default: "initiated",
        },
    },
    { timestamps: true }
);

const VisaApplication = model("VisaApplication", visaApplicationSchema);

module.exports = VisaApplication;
