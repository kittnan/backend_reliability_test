const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const model_master = new Schema({
    modelName: String,
    modelNo: String,
    type: String,
    customer: String,
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("model_master", model_master);

module.exports = UserModule;