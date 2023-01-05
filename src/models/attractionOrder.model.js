const { Schema, model } = require("mongoose");

const attractionOrderSchema = new Schema(
    {
        activities: {
            type: [
                {
                    activity: {
                        type: Schema.Types.ObjectId,
                        ref: "AttractionActivity",
                        required: true,
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
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        orderStatus: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["created", "completed"],
        },
        paymentStatus: {
            type: String,
        },
        paymentOrderId: {
            type: String,
        },
        referenceNo: {
            type: Number,
        },
    },
    { timestamps: true }
);

const AttractionOrder = model("AttractionOrder", attractionOrderSchema);

module.exports = AttractionOrder;
