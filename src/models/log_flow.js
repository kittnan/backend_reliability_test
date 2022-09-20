const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const log_flow = new Schema({

}, { timestamps: true, versionKey: false, strict: false });

const UserModule = mongoose.model("log_flow", log_flow);

module.exports = UserModule;