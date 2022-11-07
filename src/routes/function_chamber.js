let express = require("express");
let router = express.Router();

const Function_chamber = require("../models/function_chamber");

router.get("", (req, res, next) => {
    Function_chamber.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.get("/lastRecord", (req, res, next) => {
    Function_chamber.aggregate([{
            $match: {},
        }, ])
        .sort({ updatedAt: -1 })
        .limit(1)
        .exec((err, result) => {
            if (err) res.json(err);
            res.json(result);
        });
});

router.post("/insert", async(req, res, next) => {
    Function_chamber.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    Function_chamber.updateMany({ _id: id }, { $set: req.body }).exec(
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
    Function_chamber.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;