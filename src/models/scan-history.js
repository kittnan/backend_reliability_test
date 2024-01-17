const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const section_master = new Schema(
  {
    runNo: String,
    code: String,
    status: String,
    at:Number,
    condition:Object,
    scanDate:Date
  },
  { timestamps: true, versionKey: false, strict: true }
);

const UserModule = mongoose.model("scanhistories", section_master);

module.exports = UserModule;
