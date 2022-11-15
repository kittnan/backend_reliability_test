const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chamber_list = new Schema({
    capacity: String,
    code: String,
    name: String,
    function: [],
    status: Boolean,
    use: {
        type: Number,
        default: 0,
        required: true,
    },
    running: Number,
    queue: []
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("chamber_list", chamber_list);

module.exports = UserModule;