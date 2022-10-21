const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formStep3TestingType = new Schema({
    requestId: String,
    data: []
}, { timestamps: true, versionKey: false, strict: true });

const UserModule = mongoose.model("formStep3TestingType", formStep3TestingType);

module.exports = UserModule;