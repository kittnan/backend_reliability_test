let express = require("express");
let router = express.Router();
const mailConfig = require("../models/mail-config");
const nodemailer = require("nodemailer");

router.get("", (req, res, next) => {
    mailConfig.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/insert", async(req, res, next) => {
    mailConfig.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    mailConfig.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    mailConfig.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/send", async(req, res, next) => {
    const payload = req.body;
    const mail = await mailConfig.aggregate([{ $match: {} }]);
    let transporter = nodemailer.createTransport({
        host: mail[0].host,
        port: mail[0].port,
        secure: false,
        auth: mail[0].auth,
    });

    let info = await transporter.sendMail({
        from: mail[0].from, // sender address
        to: payload.to, // list of receivers
        subject: mail[0].subject, // Subject line
        html: mail[0].body,
    });
    res.json(info);
});

module.exports = router;