const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const request_form = new Schema(
  {
    userId: String,
    date: Date,
    controlNo: String,
    corporate: String,
    status: String,
    table: {},
    nextApprove: {
      _id: String,
      name: String,
    },
    comment: String,
    level: Number,
    qeReceive: {
      date: Date,
      qty: Number,
    },
    followUp: [],
  },
  { timestamps: true, versionKey: false, strict: false }
);

const UserModule = mongoose.model("request_form", request_form);

module.exports = UserModule;
