const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const section_master = new Schema({
    name: String,
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("section_master", section_master);

module.exports = UserModule;