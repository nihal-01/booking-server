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
                    bookingType: {
                        type: String,
                        required: true,
                        enum: ["booking", "ticket"],
                    },
                    activity: {
                        type: Schema.Types.ObjectId,
                        ref: "AttractionActivity",
                        required: true,
                    },
                    activityType: {
                        type: String,
                        required: true,
                        lowercase: true,
                        enum: ["normal", "transfer"],
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
                    adultActivityPrice: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    childActivityPrice: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    infantActivityPrice: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    adultActivityTotalPrice: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    childActivityTotalPrice: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    infantActivityTotalPrice: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    adultActivityCost: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    childActivityCost: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    infantActivityCost: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    adultActivityTotalCost: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    childActivityTotalCost: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    infantActivityTotalCost: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    activityTotalPrice: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    activityTotalCost: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    transferType: {
                        type: String,
                        lowercase: true,
                        enum: ["without", "private", "shared"],
                        required: true,
                    },
                    sharedTransferPrice: {
                        type: Number,
                        required: function () {
                            return this.transferType === "shared";
                        },
                        default: 0,
                    },
                    sharedTransferCost: {
                        type: Number,
                        required: function () {
                            return this.transferType === "shared";
                        },
                        default: 0,
                    },
                    sharedTransferTotalPrice: {
                        type: Number,
                        required: function () {
                            return this.transferType === "shared";
                        },
                        default: 0,
                    },
                    sharedTransferTotalCost: {
                        type: Number,
                        required: function () {
                            return this.transferType === "shared";
                        },
                        default: 0,
                    },
                    privateTransfers: {
                        type: [
                            {
                                pvtTransferId: {
                                    type: Schema.Types.ObjectId,
                                    required: true,
                                },
                                name: { type: String, required: true },
                                maxCapacity: { type: Number, required: true },
                                count: { type: Number, required: true },
                                price: { type: Number, required: true },
                                cost: { type: Number, required: true },
                                totalPrice: { type: Number, required: true },
                            },
                        ],
                        default: [],
                    },
                    privateTransfersTotalPrice: {
                        type: Number,
                        required: function () {
                            return this.transferType === "private";
                        },
                        default: 0,
                    },
                    privateTransfersTotalCost: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
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
                    totalMarkup: {
                        type: Number,
                        required: true,
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
                    totalCost: {
                        type: Number,
                        required: true,
                    },
                    profit: {
                        type: Number,
                        required: true,
                    },
                    grandTotal: { type: Number, required: true },
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
