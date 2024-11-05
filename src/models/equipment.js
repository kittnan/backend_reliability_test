const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const section_master = new Schema({
    name: String,
    description: String,
    imgs: [],
    active: {
        type: Boolean,
        default: true,
        require: true
    }
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("equipments", section_master);

module.exports = UserModule;