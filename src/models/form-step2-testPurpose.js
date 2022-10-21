const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formStep2TestPurpose = new Schema({
    requestId: String,
    description: {},
    purpose: String
}, { timestamps: true, versionKey: false, strict: true });

const UserModule = mongoose.model("formStep2TestPurpose", formStep2TestPurpose);

module.exports = UserModule;