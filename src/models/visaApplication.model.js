const { Schema, model } = require("mongoose");

const visaApplicationSchema = new Schema(
    {
        visaType: {
            type: Schema.Types.ObjectId,
            ref: "VisaType",
            required: true,
        },
        visaPrice : {
            type: Number,
            required: true,
        },
        totalAmount:{
            type: Number,
            required: true,
        },
        subAgentMarkup:{
            type: Number,
            required: true,
        },
        resellerMarkup:{
            type: Number,
            required: true,
        },
        profit:{
            type: Number,
            required: true,
        },
        reseller : {
            type: Schema.Types.ObjectId,
            ref: "Reseller",
            required: true,
        },
        orderedBy : {
            type: String,
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
      
        onwardDate: {
            type: Date,
            required:true,
        },
        otp : {
            type: Number,
            required: true,
        },
        returnDate: {
            type: Date,
            required:true,
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
                    expiryDate: {
                       
                        month: {
                            type: Number,
                            required: true,
                        },
                        year: {
                            type: Number,
                            required: true,
                        },
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
                        type: String,
                        required: true,
                    },
                    
                    documents: {
                        type: Schema.Types.ObjectId,
                        ref: "VisaDocument",
                        required: function () {
                            return this.isDocumentUplaoded === true;
                        },
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
        
     
        status: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["initiated", "submitted", "approved", "cancelled"],
            default: "initiated",
        },
        referenceNumber : {
            type: String,
            required: true,
        }
    },
    { timestamps: true }
);

const VisaApplication = model("VisaApplication", visaApplicationSchema);

module.exports = VisaApplication;
