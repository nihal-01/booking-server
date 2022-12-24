const { Schema, model } = require("mongoose");

const subscriberSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: [true, "You have already subscribed!"],
        },
        subscribed: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    { timestamps: true }
);

const Subscriber = model("Subscriber", subscriberSchema);

module.exports = Subscriber;
