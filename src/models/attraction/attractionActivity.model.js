const { Schema, model } = require("mongoose");

const attractionActivitySchema = new Schema(
    {
        attraction: {
            type: Schema.Types.ObjectId,
            ref: "Attraction",
            required: true,
        },
        // availableFor: {
        //     type: [{
        //         type: String,
        //         required: true,
        //         lowercase: true,
        //         enum: ["adult", "child", "infant"],
        //     }],
        // },
        name: {
            type: String,
            required: true,
        },
        activityType: {
            type: String,
            required: true,
            enum: ["normal", "transfer"],
        },
        description: {
            type: String,
        },
        adultAgeLimit: {
            type: Number,
            required: true,
        },
        adultPrice: {
            type: Number,
            required: function () {
                return this.activityType === "normal";
            },
        },
        childAgeLimit: {
            type: Number,
            required: true,
        },
        childPrice: {
            type: Number,
            required: function () {
                return this.activityType === "normal";
            },
        },
        infantAgeLimit: {
            type: Number,
            required: true,
        },
        infantPrice: {
            type: Number,
        },
        adultCost: {
            type: Number,
        },
        childCost: {
            type: Number,
        },
        infantCost: {
            type: Number,
        },
        isVat: {
            type: Boolean,
            required: true,
        },
        vat: {
            type: Number,
            required: function () {
                return this.isVat === true;
            },
        },
        base: {
            type: String,
            required: true,
            lowercase: true,
            enum: ["person", "private", "hourly"],
        },
        isSharedTransferAvailable: {
            type: Boolean,
            required: true,
        },
        sharedTransferPrice: {
            type: Number,
            required: function () {
                return this.isSharedTransferAvailable === true;
            },
        },
        sharedTransferCost: {
            type: Number,
            required: function () {
                return this.isSharedTransferAvailable === true;
            },
        },
        isPrivateTransferAvailable: {
            type: Boolean,
            required: true,
        },
        privateTransfers: {
            type: [
                {
                    name: { type: String, required: true },
                    maxCapacity: { type: Number, required: true },
                    price: { type: Number, required: true },
                    cost: { type: Number, required: true },
                },
            ],
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        peakTime: {
            type: Date,
        },
        note: {
            type: String,
        },
        productId: {
            type: String,
        },
        productCode: {
            type: String,
        },
        isApiSync: {
            type: Boolean,
            required: true,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    { timestamps: true }
);

const AttractionActivity = model(
    "AttractionActivity",
    attractionActivitySchema
);

module.exports = AttractionActivity;
