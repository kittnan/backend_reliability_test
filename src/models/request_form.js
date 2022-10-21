const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const request_form = new Schema({
    userId: String,
    date: Date,
    controlNo: String,
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("request_form", request_form);

module.exports = UserModule;