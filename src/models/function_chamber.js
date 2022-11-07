const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const data = new Schema({
    name: String,
    value: Number
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("function_chamber", data);

module.exports = UserModule;