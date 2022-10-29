const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const testing_type_master = new Schema({
    group: String,
    list: {
        type: [{
            name: String,
            checked: {
                type: Boolean,
                default: false,
            },
            description: {
                status: {
                    type: Boolean,
                    default: false,
                },
                value: String,
            },
            // listItem: [],
        }, ],
        required: false
    },
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("testing_type_master", testing_type_master);

module.exports = UserModule;