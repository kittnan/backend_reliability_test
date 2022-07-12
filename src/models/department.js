const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const department_master = new Schema({
    name: String,
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("department_master", department_master);

module.exports = UserModule;