let express = require("express");
let router = express.Router();

const step5 = require("../models/form-step5-userApprove");



router.get("", (req, res, next) => {
    step5.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/insert", async(req, res, next) => {
    step5.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    step5.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    step5.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;