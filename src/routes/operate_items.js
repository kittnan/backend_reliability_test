let express = require("express");
let router = express.Router();

const operate_items = require("../models/operate-items");

router.get("", (req, res, next) => {
    operate_items.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.get("/lastCode", (req, res, next) => {
    operate_items
        .aggregate([{
            $match: {},
        }, ])
        .sort({ code: -1 })
        .limit(1)
        .exec((err, result) => {
            if (err) res.json(err);
            res.json(result);
        });
});
router.get("/countCode/:code", (req, res, next) => {
    const { code } = req.params;
    operate_items
        .aggregate([{
            $match: {
                code: code
            },
            $count: 'count'
        }, ])
        .exec((err, result) => {
            if (err) res.json(err);
            res.json(result);
        });
});

router.post("/insert", async(req, res, next) => {
    operate_items.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    operate_items
        .updateMany({ _id: id }, { $set: req.body })
        .exec((err, result) => {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
        });
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    operate_items.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;