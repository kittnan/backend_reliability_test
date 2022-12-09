let express = require("express");
let router = express.Router();

const step2 = require("../models/form-step2-testPurpose");

router.get("", (req, res, next) => {
    console.log(req.query);
    const { requestId } = req.query;
    step2
        .aggregate([{
            $match: {
                requestId: requestId,
            },
        }, ])
        .exec((err, result) => {
            console.log(err, result);
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
        });

});

router.post("/insert", async(req, res, next) => {
    step2.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    step2.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    step2.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;