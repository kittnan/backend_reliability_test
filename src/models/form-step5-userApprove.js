const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formStep5UserApprove = new Schema(
  {
    requestId: String,
    prevUser: {
      _id: String,
      name: String,
    },
    nextUser: {
      _id: String,
      name: String,
    },
    prevStatusForm: String,
    nextStatusForm: String,
    comment: [],
    level: Number,
    date: Date,

    // requestId: String,
    // authorize: String,
    // userId: String,
    // userName: String,
    // statusApprove: Boolean,
    // dateApprove: Date,
    // dateReject: Date,
    // comment: [],
    // level: Number
  },
  { timestamps: true, versionKey: false, strict: true }
);

const UserModule = mongoose.model("formStep5UserApprove", formStep5UserApprove);

module.exports = UserModule;
