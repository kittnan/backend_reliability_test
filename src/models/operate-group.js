const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OperateGroup = new Schema({
    code: String,
    name: String,
    operate: [],
    status: String
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("operate-group", OperateGroup);

module.exports = UserModule;