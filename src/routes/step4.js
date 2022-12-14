let express = require("express");
let router = express.Router();

const step4 = require("../models/form-step4-testingCondition");




router.get("", (req, res, next) => {
    const { requestId } = req.query;
    step4
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
    step4.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    step4.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    step4.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;