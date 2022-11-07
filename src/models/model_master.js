const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const model_master = new Schema({
    modelNo: String,
    modelName: String,
    customer: String,
    size: String,
    operateGroupCode: String
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("model_master", model_master);

module.exports = UserModule;