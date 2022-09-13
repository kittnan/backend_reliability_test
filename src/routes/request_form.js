let express = require("express");
let router = express.Router();

const request_form = require("../models/request_form");

router.get("", (req, res, next) => {
    request_form.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/insert", async(req, res, next) => {
    let body = req.body;
    const result = await request_form.aggregate([{
        $match: {
            "step1.controlNo": body.step1.controlNo,
        },
    }, ]);
    if (result.length > 0) {
        const result = await request_form
            .aggregate([])
            .sort({ createdAt: -1 })
            .limit(1);
        body.step1.controlNo = await genControlNo(result[0]);
        request_form.insertMany(body, (err, result) => {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
        });
    } else {
        request_form.insertMany(body, (err, result) => {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
        });
    }
});

function genControlNo(result) {
    return new Promise((resolve) => {
        const res_split = result.step1.controlNo.split("-");
        let newControlNo = (
            Number(res_split[3]) + 1
        ).toString();
        newControlNo.length === 1 ?
            (newControlNo = "00" + newControlNo) :
            newControlNo;
        newControlNo.length === 2 ?
            (newControlNo = "0" + newControlNo) :
            newControlNo;
        resolve(`${res_split[0]}-${res_split[1]}-${res_split[2]}-${newControlNo}-${res_split[4]}-${res_split[5]}`);
    });
}

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    request_form
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
    request_form.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/count", (req, res, next) => {
    const condition = [{
            $match: {
                createdAt: {
                    $gte: new Date(req.body.date),
                },
                "step1.corporate": {
                    $eq: req.body.corporate,
                },
            },
        },
        {
            $count: "document",
        },
    ];
    request_form.aggregate(condition).exec((err, result) => {
        res.json(result);
    });
});

module.exports = router;