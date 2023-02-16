const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const data = new Schema(
  {
    level: Number,
    status: String,
    name: String,
    groupStatus: Boolean,
    selected: {},
    groupList: [],
  },
  { timestamps: true, versionKey: false }
);

const UserModule = mongoose.model("approver", data);

module.exports = UserModule;
