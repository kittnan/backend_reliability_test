let express = require("express");
let router = express.Router();

const chamber_list = require("../models/chamber_list");
const queue = require("../models/queue");

router.get("", (req, res, next) => {
    chamber_list.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.get("/chamber/:value", (req, res, next) => {
    const { value } = req.params;
    chamber_list
        .aggregate([{
            $match: {
                "function.value": parseInt(value),
            },
        }, ])
        .exec((err, result) => {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
        });
});

router.get("/ready/:value/:startDate/:qty", async(req, res, next) => {
    try {
        const { value, startDate, qty } = req.params;
        const chamber = await chamber_list.aggregate([{
            $match: {
                "function.value": Number(value),
            },
        }, ]);
        const codes = await mapChamberCode(chamber);
        const r_queue = await findChamberQueue(codes, startDate);
        const r_mapChamber = await mapChamber(chamber, r_queue, qty);
        const freeChamber = await filterChamber(r_mapChamber);
        res.json(freeChamber);
    } catch (error) {
        res.json({
            status: false,
            text: error,
        });
    }
});

function mapChamberCode(chamber) {
    return new Promise((resolve) => {
        resolve(
            chamber.map((c) => {
                return c.code;
            })
        );
    });
}

function findChamberQueue(codes, startDate) {
    return new Promise((resolve) => {
        const r_queue = queue.aggregate([{
                $match: {
                    endDate: {
                        $gte: new Date(startDate),
                    },
                    "chamber.code": {
                        $in: codes,
                    },
                },
            },
            {
                $group: {
                    _id: "$chamber.code",
                    total: {
                        $sum: "$work.qty",
                    },
                },
            },
        ]);
        resolve(r_queue);
    });
}

function mapChamber(chamber, r_queue, qty) {
    return new Promise((resolve) => {
        resolve(
            chamber.map((c) => {
                const foundItem = r_queue.find((q) => q._id == c.code) ?
                    r_queue.find((q) => q._id == c.code).total :
                    0;
                let freeCap = Number(c.capacity) - Number(foundItem);
                let temp = {...c };

                if (freeCap >= qty) {
                    temp = {
                        ...temp,
                        free: freeCap,
                        status: true,
                    };
                } else {
                    temp = {
                        ...temp,
                        status: false,
                    };
                }

                if (foundItem) {
                    temp['run'] = foundItem
                } else {
                    temp['run'] = 0
                }
                return temp

            })
        );
    });
}

function filterChamber(chamber) {
    return new Promise((resolve) => {
        resolve(chamber.filter((c) => c.status));
    });
}

router.get("/lastRecord", (req, res, next) => {
    chamber_list
        .aggregate([{
            $match: {},
        }, ])
        .sort({ createdAt: -1 })
        .limit(1)
        .exec((err, result) => {
            if (err) res.json(err);
            res.json(result);
        });
});

router.post("/insert", (req, res, next) => {
    chamber_list.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/insertQueue", (req, res, next) => {
    console.log(req.body);
    // chamber_list.insertMany(req.body, (err, result) => {
    //     if (err) {
    //         res.json(err);
    //     } else {
    //         res.json(result);
    //     }
    // });
});

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    chamber_list
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
    chamber_list.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;