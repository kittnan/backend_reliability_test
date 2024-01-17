const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const operate_items = new Schema({}, { timestamps: true, versionKey: false, strict: false });

const UserModule = mongoose.model("tracking_operates", operate_items);

module.exports = UserModule;
