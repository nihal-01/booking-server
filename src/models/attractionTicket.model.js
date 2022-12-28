const { Schema, model } = require("mongoose");

const attractionTicketSchema = new Schema(
    {
        ticketNo: {
            type: String,
            required: true,
        },
        lotNo: {
            type: String,
            required: true,
        },
        ticketFor: {
            type: String,
            required: true,
            enum: ["adult", "child"],
        },
        activity: {
            type: Schema.Types.ObjectId,
            ref: "AttractionActivity",
            required: true,
        },
        validity: {
            type: Boolean,
            required: true,
            default: false,
        },
        validTill: {
            type: Date,
            required: function () {
                return this.validity === true;
            },
        },
        details: {
            type: String,
        },
        status: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["ok", "used", "cancelled"],
        },
        isReserved: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

const AttractionTicket = model("AttractionTicket", attractionTicketSchema);

module.exports = AttractionTicket;
