const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema({
    employee_ID: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
    },
    authorize: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true,
        default: "system"
    }
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("user", User);

module.exports = UserModule;