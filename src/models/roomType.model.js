const { Schema, model } = require("mongoose");

const roomTypeSchema = new Schema({});

const RoomType = model("RoomType", roomTypeSchema);

module.exports = RoomType;
