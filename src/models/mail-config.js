const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const data = new Schema({
    host: String,
    port: Number,
    from: String,
    to: [],
    subject: String,
    body: String,
    auth: {
        user: String,
        pass: String,
    },
}, { timestamps: true, versionKey: false });

const UserModule = mongoose.model("mails", data);

module.exports = UserModule;