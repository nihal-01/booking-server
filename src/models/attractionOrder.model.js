const { Schema, model } = require("mongoose");

const attractionOrderSchema = new Schema(
    {
        attraction: {
            type: Schema.Types.ObjectId,
            ref: "Attraction",
            required: true,
        },
        orders: {
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
                        enum: ["private", "shared"],
                    },
                },
            ],
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            required: true,
            enum: ["pending", "booked", "confirmed", "cancelled"],
        },
    },
    { timestamps: true }
);

const AttractionOrder = model("AttractionOrder", attractionOrderSchema);

module.exports = AttractionOrder;
