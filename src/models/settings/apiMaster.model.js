const { Schema, model } = require("mongoose");

const apiMasterSchema = new Schema(
    {
        apiCode: {
            type: String,
            required: true,
        },
        apiName: {
            type: String,
            required: true,
        },
        demoUrl: {
            type: String,
            required: true,
        },
        demoAgentId: {
            type: String,
        },
        demoUsername: {
            type: String,
            required: true,
        },
        demoPassword: {
            type: String,
            required: true,
        },
        liveUrl: {
            type: String,
            required: true,
        },
        liveAgentId: {
            type: String,
        },
        liveUsername: {
            type: String,
            required: true,
        },
        livePassword: {
            type: String,
            required: true,
        },
        runningMode: {
            type: String,
            required: true,
            enum: ["demo", "live"],
            lowercase: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["attraction", "visa", "hotel", "flight"],
            lowercase: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    { timestamps: true }
);

const ApiMaster = model("ApiMaster", apiMasterSchema);

module.exports = ApiMaster;
