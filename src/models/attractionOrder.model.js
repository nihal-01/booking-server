const { Schema, model } = require("mongoose");

const attractionOrderSchema = new Schema(
    {
        attraction: {
            type: Schema.Types.ObjectId,
            ref: "Attraction",
            required: true,
        },
        bookingType: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["booking", "ticket"],
        },
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
                    adultTickets: { type: [] },
                    childTickets: { type: [] },
                    price: { type: Number, required: true },
                    status: {
                        type: String,
                        lowercase: true,
                        enum: ["booked", "confirmed", "cancelled", "refunded"],
                    },
                },
            ],
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        offerAmount: {
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
            enum: ["initiated", "created", "completed"],
        },
        paymentStatus: {
            type: String,
        },
        orderId: {
            type: String,
        },
    },
    { timestamps: true }
);

const AttractionOrder = model("AttractionOrder", attractionOrderSchema);

module.exports = AttractionOrder;
