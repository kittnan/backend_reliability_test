const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const test_purpose_master = new Schema({
    name: String,
    checked: {
        type: Boolean,
        default: false
    },
    description: {
        status: {
            type: Boolean,
            default: false
        },
        value: String,
    },
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("test_purpose_master", test_purpose_master);

module.exports = UserModule;