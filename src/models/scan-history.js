const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const section_master = new Schema(
  {
    runNo: String,
    code: String,
    action: String,
    condition: Object,
    scanDate: Date,
    scanDateLocal: String,
    diff_hour: Number,
    diff_min: Number,
    stage: Number,
    queue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'queues' },
    user: Object,
    createdAtLocal: String, // This will store the local time string
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  }
);

// Middleware เพื่อเพิ่ม customVersion เมื่อมีการอัปเดต
// section_master.pre('save', function (next) {
//   if (this.isNew) {
//     this.documentVersion = 1; // ถ้าเป็นเอกสารใหม่
//   } else {
//     this.documentVersion += 1; // เพิ่มเวอร์ชันเมื่อมีการอัปเดต
//   }
//   next();
// });

// section_master.methods.softDelete = function() {
//   this.isDeleted = true;
//   return this.save();
// };

// // Pre-validate middleware to set createdAtLocal before validating the document
// section_master.pre('validate', function (next) {
//   if (this.createdAt) {
//     this.createdAtLocal = this.createdAt.toLocaleString(); // Convert to local time string
//   }
//   next();
// });
const UserModule = mongoose.model("scanhistories", section_master);

module.exports = UserModule;
