const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const interval_master = new Schema({
    name: String,
    value: Number
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("interval_master", interval_master);

module.exports = UserModule;