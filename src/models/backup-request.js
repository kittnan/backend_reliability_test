const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const backup_request = new Schema(
  {},
  { timestamps: true, versionKey: false, strict: false }
);

const UserModule = mongoose.model("backup_request", backup_request);

module.exports = UserModule;
