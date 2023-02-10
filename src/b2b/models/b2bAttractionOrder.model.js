const { Schema, model } = require("mongoose");

const b2battractionOrderSchema = new Schema(
    {
        reseller: {
            type: Schema.Types.ObjectId,
            ref: "Reseller",
            required: true,
        },
        orderedBy: {
            type: String,
            required: true,
            enum: ["reseller", "sub-agent"],
        },
        activities: {
            type: [
                {
                    attraction: {
                        type: Schema.Types.ObjectId,
                        ref: "Attraction",
                        required: true,
                    },
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
                    purchaseCost: {
                        type: Number,
                        required: true,
                    },
                    profit: {
                        type: Number,
                        required: true,
                    },
                    transferType: {
                        type: String,
                        lowercase: true,
                        enum: ["without", "private", "shared"],
                        required: true,
                    },
                    amount: { type: Number, required: true },
                    adultTickets: { type: [] },
                    childTickets: { type: [] },
                    infantTickets: { type: [] },
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
                    resellerMarkup: {
                        type: Number,
                        required: true,
                    },
                    subAgentMarkup: {
                        type: Number,
                        required: function () {
                            return this.orderedBy === "sub-agent";
                        },
                    },
                    markups: {
                        type: [
                            {
                                to: {
                                    type: Schema.Types.ObjectId,
                                    ref: "Reseller",
                                    required: true,
                                },
                                amount: {
                                    type: Number,
                                    required: true,
                                },
                                isExpiry: {
                                    type: Boolean,
                                    required: true,
                                },
                            },
                        ],
                    },
                },
            ],
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        orderStatus: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["pending", "paid", "failed"],
        },
        paymentOrderId: {
            type: String,
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
        otp: {
            type: Number,
        },
        referenceNumber: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const B2BAttractionOrder = model(
    "B2BAttractionOrder",
    b2battractionOrderSchema
);

module.exports = B2BAttractionOrder;
