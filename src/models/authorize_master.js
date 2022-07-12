const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const authorize = new Schema({
    name: String,
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("authorize", authorize);

module.exports = UserModule;