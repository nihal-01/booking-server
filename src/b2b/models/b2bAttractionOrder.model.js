const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const { Schema, model } = mongoose;

const b2battractionOrderSchema = new Schema(
    {
        activities: {
            type: [
                {
                    activity: {
                        type: Schema.Types.ObjectId,
                        ref: "AttractionActivity",
                        required: true,
                    },
                    bookingType: {
                        type: String,
                        required: true,
                        enum: ["booking", "ticket"],
                    },
                    date: {
                        type: Date,
                        required: true,
                    },
                    adultsCount: {
                        type: Number,
                        required: true,
                    },
                    childrenCount: {
                        type: Number,
                        required: true,
                    },
                    infantCount: {
                        type: Number,
                        required: true,
                    },
                    profit: {
                        type: Number,
                    },
                    transferType: {
                        type: String,
                        lowercase: true,
                        enum: ["without", "private", "shared"],
                    },
                    offerAmount: { type: Number, required: true },
                    amount: { type: Number, required: true },
                    adultTickets: { type: [] },
                    childTickets: { type: [] },
                    status: {
                        type: String,
                        lowercase: true,
                        enum: ["pending", "booked", "confirmed", "cancelled"],
                    },
                    bookingConfirmationNumber: {
                        type: String,
                        required: function () {
                            return (
                                this.status === "confirmed" &&
                                this.bookingType === "booking"
                            );
                        },
                    },
                    driver: {
                        type: Schema.Types.ObjectId,
                        ref: "Driver",
                        required: function () {
                            return (
                                this.status === "confirmed" &&
                                this.bookingType === "booking"
                            );
                        },
                    },
                    isRefunded: {
                        type: Boolean,
                        required: true,
                        default: false,
                    },
                },
            ],
        },
        totalOffer: {
            type: Number,
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        orderStatus: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["pending", "paid", "failed"]
        },
        paymentOrderId: {
            type: String,
        },
        reseller : {
            type: Schema.Types.ObjectId,
            ref: "Reseller",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: true,
        },
        referenceNumber: {
            type: Number,
        },
    },
    { timestamps: true }
);

b2battractionOrderSchema.plugin(AutoIncrement, {
    inc_field: "referenceNumber",
    start_seq: 10000,
});

const B2BAttractionOrder = model("B2BAttractionOrder", b2battractionOrderSchema);

module.exports = B2BAttractionOrder;