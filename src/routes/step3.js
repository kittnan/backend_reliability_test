let express = require("express");
let router = express.Router();

const step3 = require("../models/form-step3-testingType");

router.get("", (req, res, next) => {
    console.log(req.query);
    const { requestId } = req.query;
    step3
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
    step3.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    step3.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    step3.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;