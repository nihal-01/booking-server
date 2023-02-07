const { Schema, model } = require("mongoose");

const b2cWithdrawRequestSchema = new Schema({});

const B2cWithdrawRequest = model(
    "B2cWithdrawRequest",
    b2cWithdrawRequestSchema
);

module.exports = { B2cWithdrawRequest };
