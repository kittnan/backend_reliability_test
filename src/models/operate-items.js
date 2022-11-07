const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const operate_items = new Schema({
    code: String,
    type: String,
    name: String,
    stock: Number,
    qty: Number,
    qtyNon: Number,
    status: String,
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("operate_items", operate_items);

module.exports = UserModule;