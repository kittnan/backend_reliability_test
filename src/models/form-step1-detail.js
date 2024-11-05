const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formStep1Detail = new Schema(
  {
    requestId: String,
    concernCustomerDate: Date,
    concernShipmentDate: Date,
    controlNo: String,
    requestSubject: String,
    corporate: String,
    customer: String,
    department: String,
    files: [],
    inputToProductionDate: Date,
    lotNo: String,
    modelName: String,
    modelNo: String,
    reportRequireDate: Date,
    requestDate: Date,
    requestStatus: String,
    sampleDescription: String,
    sampleSentToQE_withinDate: Date,
    size: String,
    sampleSendQty: Number,
  },
  { timestamps: true, versionKey: false, strict: true }
);

const UserModule = mongoose.model("formStep1Detail", formStep1Detail);

module.exports = UserModule;
