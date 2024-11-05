const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const data = new Schema(
  {
    startDate: Date,
    endDate: Date,
    inspectionTime: [
      {
        at: Number,
        startDate: Date,
        endDate: Date,
        hr: Number,
        onPlan: {
          type: Boolean,
          default: true,
        },
        pass: Boolean
      },
    ],
    reportTime: [
      {
        at: Number,
        startDate: Date,
        endDate: Date,
        hr: Number,
        files: [],
      },
    ],
    reportQE: [
      {
        at: Number,
        startDate: Date,
        endDate: Date,
        hr: Number,
        files: [],
        resultDetail: String,
      },
    ],
    work: {
      requestId: String,
      qty: Number,
      controlNo: String,
    },
    condition: {
      value: String,
      name: String,
    },
    operate: {
      attachment: {
        code: String,
        name: String,
        qty: Number,
      },
      checker: {
        code: String,
        name: String,
        qty: Number,
      },
      power: {
        code: String,
        name: String,
        qty: Number,
      },
      status: Boolean,
    },
    chamber: {
      code: String,
      name: String,
    },
    status: String,
    historyDelayTime: {
      type: [],
      default: [],
    },
    scans:{
      default:[],
      type: []
    },
    total_hour:{
      default:0,
      type:Number
    },
    stage:{
      type:Number,
      default:0
    }
  },
  { timestamps: true, versionKey: false }
);

const UserModule = mongoose.model("queue", data);

module.exports = UserModule;
