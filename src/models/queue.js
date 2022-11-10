const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const data = new Schema({
    startDate: Date,
    endDate: Date,
    inspectionTime: [{
        at: Number,
        startDate: Date,
        endDate: Date,
        min: Number,
    }, ],
    reportTime: [{
        at: Number,
        startDate: Date,
        endDate: Date,
        min: Number,
    }, ],
    work: {
        requestId: String,
        qty: Number,
    },
    condition: {
        code: String,
        tool: {
            power: {},
            attachment: {},
            checker: {},
        },
    },
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("queue", data);

module.exports = UserModule;