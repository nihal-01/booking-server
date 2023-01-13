const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const AutoIncrement = require("mongoose-sequence")(mongoose);


const resellerSchema = new Schema(
    {   
        agentCode: {
            type: Number,
        }, 
        companyName: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        website: {
            type: String,
            required: true,
        },
        country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        zipCode: {
            type: Number,
            required: true,
        },
        designation: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["director", "manager", "executive", "travel-consultant"],
        },
        name: {
            type: String,
            required: true,
        },
        mobileNumber: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        skypeId: {
            type: String,
            required: true,
        },
        whatsappNumber: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        resellerId: {
            type: String,
            required: true,
        }, status: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

resellerSchema.plugin(AutoIncrement, {
    inc_field: "agentCode",
    start_seq: 10000,
});

const Reseller = model("Reseller", resellerSchema);

module.exports = Reseller;
