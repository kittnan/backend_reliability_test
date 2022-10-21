const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formStep5UserApprove = new Schema({
    requestId: String,
    authorize: String,
    userId: String,
    dateApprove: Date
}, { timestamps: true, versionKey: false, strict: true });

const UserModule = mongoose.model("formStep5UserApprove", formStep5UserApprove);

module.exports = UserModule;