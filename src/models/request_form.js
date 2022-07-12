const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const request_form = new Schema({
    step1: {
        controlNo: {
            type: String,
        },
        corporate: {
            type: String,
        },
        customer: {
            type: String,
        },
        department: {
            type: String,
        },
        lotNo: {
            type: String,
        },
        modelName: {
            type: String,
        },
        modelNo: {
            type: String,
        },
        requestStatus: {
            type: String,
        },
        sampleDescription: {
            type: String,
        },
        type: {
            type: String,
        },
        concernCustomerDate: {
            type: Date,
        },
        concernShipmentDate: {
            type: Date,
        },
        inputToProductionDate: {
            type: Date,
        },
        reportRequireDate: {
            type: Date,
        },
        requestDate: {
            type: Date,
        },
        sampleSentToQE_withinDate: {
            type: Date,
        },
        files: [],
    },
    step2: {
        description: {},
        purpose: String,
    },
    step3: [{}],
    step4: {
        userRequest: {
            name: String,
            status: Boolean,
            time: Date,
        },
        userApprove: {
            name: String,
            status: Boolean,
            time: Date,
        },
    },
    status: {
        type: String
    }
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("request_form", request_form);

module.exports = UserModule;