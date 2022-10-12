const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const testing_condition_master = new Schema({
    name: String,
    list: [],
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("testing_condition_master", testing_condition_master);

module.exports = UserModule;