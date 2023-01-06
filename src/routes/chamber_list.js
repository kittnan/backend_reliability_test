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

router.get("/ready", async(req, res, next) => {
    const { value, startDate, qty } = req.query;
    try {
        // const { value, startDate, qty } = req.params;
        const chamber = await chamber_list.aggregate([{
            $match: {
                "function.value": Number(value),
            },
        }, ]);
        const codes = await mapChamberCode(chamber);
        const r_queue = await findChamberQueue(codes, startDate);
        const remain = await findChamberQueueNoGroup(codes, startDate);
        const r_mapChamber = await mapChamber(chamber, r_queue, remain, qty);
        const freeChamber = await filterChamber(r_mapChamber);
        const r_mapCondition = await mapCondition(freeChamber, value);
        res.json(r_mapCondition);
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

function findChamberQueueNoGroup(codes, startDate) {
    return new Promise((resolve) => {
        const r_queue = queue
            .aggregate([{
                $match: {
                    endDate: {
                        $gte: new Date(startDate),
                    },
                    "chamber.code": {
                        $in: codes,
                    },
                },
            }, ])
            .sort({ endDate: 1 });
        resolve(r_queue);
    });
}

function mapChamber(chamber, r_queue, remain, qty) {
    return new Promise((resolve) => {
        resolve(
            chamber.map((c) => {
                const foundItem = r_queue.find((q) => q._id == c.code) ?
                    r_queue.find((q) => q._id == c.code) : {
                        total: 0,
                    };
                let freeCap = Number(c.capacity) - Number(foundItem.total);
                let temp = {...c };

                if (freeCap >= Number(qty)) {
                    temp = {
                        ...temp,
                        free: freeCap,
                        status: true,
                    };
                } else {
                    temp = {
                        ...temp,
                        free: 0,
                        status: false,
                    };
                }

                if (foundItem.total > 0) {
                    temp["run"] = foundItem.total;
                    temp["remain"] = remain.filter(
                        (r) => r.chamber.code == foundItem._id
                    );
                } else {
                    temp["run"] = 0;
                    temp["remain"] = [];
                }
                return temp;
            })
        );
    });
}

function filterChamber(chamber) {
    return new Promise((resolve) => {
        resolve(chamber.filter((c) => c.status));
    });
}

function mapCondition(chamber, value) {
    return new Promise((resolve) => {
        resolve(
            chamber.map((c) => {
                if (
                    c.remain &&
                    c.remain.length > 0 &&
                    c.remain.find((r) => r.condition.value == value)
                ) {
                    return {
                        ...c,
                        status: true,
                    };
                } else if (c.remain && c.remain.length == 0) {
                    return {
                        ...c,
                        status: true,
                    };
                } else {
                    return {
                        ...c,
                        status: false,
                    };
                }
            })
        );
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