const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const request_form = new Schema(
  {},
  { timestamps: true, versionKey: false, strict: false }
);

const UserModule = mongoose.model("request_revises", request_form);

module.exports = UserModule;
