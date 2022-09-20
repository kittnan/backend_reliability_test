let express = require("express");
let router = express.Router();

const log_flow = require("../models/log_flow");

router.get("", (req, res, next) => {
    log_flow.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/insert", (req, res, next) => {
    log_flow.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});


router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    log_flow.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    log_flow.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});


module.exports = router;