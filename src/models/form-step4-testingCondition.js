const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formStep4TestingCondition = new Schema(
  {
    requestId: String,
    data: [],
    chamber: Boolean,
  },
  { timestamps: true, versionKey: false, strict: true }
);

const UserModule = mongoose.model(
  "formStep4TestingCondition",
  formStep4TestingCondition
);

module.exports = UserModule;
