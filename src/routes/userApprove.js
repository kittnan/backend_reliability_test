let express = require("express");
let router = express.Router();

const UserApprove = require("../models/form-step5-userApprove");

router.get("", (req, res, next) => {
    UserApprove.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/insert", (req, res, next) => {
    UserApprove.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});



router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    UserApprove.updateMany({ _id: id }, { $set: req.body }).exec(
        (err, result) => {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
        }
    );
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    UserApprove.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;