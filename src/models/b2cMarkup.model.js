const { Schema, model } = require("mongoose");

const b2cMarkupSchema = new Schema({});

const B2CMarkup = model("B2CMarkup", b2cMarkupSchema);

module.exports = B2CMarkup;
