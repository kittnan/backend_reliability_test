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
        delay: {
          type: Number,
          default: 0,
        },
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
  },
  { timestamps: true, versionKey: false }
);

const UserModule = mongoose.model("queue", data);

module.exports = UserModule;
