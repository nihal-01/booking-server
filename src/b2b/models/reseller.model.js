const { Schema, model } = require("mongoose");

const resellerSchema = new Schema({}, { timestamps: true });

const Reseller = model("Reseller", resellerSchema);

module.exports = Reseller;
