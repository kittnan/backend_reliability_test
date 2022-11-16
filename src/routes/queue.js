let express = require("express");
let router = express.Router();

const queue = require("../models/queue");
const chamber_list = require("../models/chamber_list");
const operate_items = require("../models/operate-items");

router.get("", (req, res, next) => {
    queue.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/insert", async(req, res, next) => {
    console.log(req.body);
    const result = await insert(req.body);
    if (result.find((item) => item.status == false)) {
        try {
            await queue.deleteMany({
                "work.requestId": req.body[0].work.requestId,
            });
            res.status(500).json(result);
        } catch (error) {
            next(error);
        }
    } else {
        res.json(result);
    }
});

async function insert(data) {
    return loopData(data);
}
async function loopData(data) {
    let result = [];
    for (let i = 0; i < data.length; i++) {
        const con_chamber = {
            startDate: data[i].startDate,
            endDate: data[i].endDate,
            qty: Number(data[i].work.qty),
            functionValue: data[i].condition.value,
            chamberCode: data[i].chamber.code,
        };
        const stateChamber = await checkStateChamber(con_chamber.chamberCode);
        console.log(stateChamber);
        if (stateChamber && stateChamber.length === 1) {
            const sum = Number(data[i].work.qty) + Number(stateChamber[0].use);
            if (sum <= Number(stateChamber[0].capacity)) {
                const resultCheckDate = await checkDate(
                    data[i].startDate,
                    data[i].endDate,
                    data[i].chamber.code,
                    data[i].condition.value
                );
                console.log("date", resultCheckDate);

                if (resultCheckDate.length > 0) {
                    const use = resultCheckDate[0].total ?
                        Number(data[i].work.qty) + resultCheckDate[0].total :
                        Number(data[i].work.qty);
                    console.log("use", use);
                    if (use <= stateChamber[0].capacity) {
                        const runningRecord = await onRunningRecord(
                            data[i].startDate,
                            data[i].chamber.code,
                            data[i].condition.value
                        );
                        const checker = await findOperateItem(data[i].operate.checker.code);
                        const checkerCount = sumCountOperates(runningRecord, "checker");
                        const checkerState =
                            Number(checkerCount) <= Number(checker[0].qty) ? true : false;
                        console.log("checkerCount", checkerCount);

                        const power = await findOperateItem(data[i].operate.power.code);
                        const powerCount = sumCountOperates(runningRecord, "power");
                        const powerState =
                            Number(powerCount) <= Number(power[0].qty) ? true : false;
                        console.log("powerCount", powerCount);

                        const attachment = await findOperateItem(
                            data[i].operate.attachment.code
                        );
                        const attachmentCount = sumCountOperates(
                            runningRecord,
                            "attachment"
                        );
                        const attachmentState =
                            Number(attachmentCount) <= Number(attachment[0].qty) ?
                            true :
                            false;
                        console.log("attachmentCount", attachmentCount);

                        if (checkerState && powerState && attachmentState) {
                            const temp = await createQueue(data[i]);
                            result.push({
                                status: true,
                                text: temp,
                            });
                        } else {
                            let textOperate = "";
                            !checkerState
                                ?
                                (textOperate += `checker ${checker[0].code}`) :
                                "";
                            !powerState ? (textOperate += `power${power[0].code}`) : "";
                            !attachmentState
                                ?
                                (textOperate += `attachment ${attachment[0].code}`) :
                                "";
                            result.push({
                                status: false,
                                text: `${textOperate} not ready`,
                            });
                        }
                    } else {
                        result.push({
                            status: false,
                            text: `${stateChamber[0].code} not ready`,
                        });
                    }
                } else {
                    const temp = await createQueue(data[i]);
                    result.push({
                        status: true,
                        text: temp,
                    });
                }
            }
        } else {
            result.push({
                status: false,
                text: `${con_chamber.chamberCode} not ready`,
            });
        }

        if (i + 1 == data.length) {
            return result;
        }
    }
}

function checkStateChamber(code) {
    return chamber_list
        .aggregate([{
            $match: {
                code: code,
                status: true,
            },
        }, ])
        .limit(1);
}

function checkDate(startDate, endDate, chamberCode, value) {
    return queue.aggregate([{
            $match: {
                endDate: {
                    $gte: new Date(startDate),
                },
                "chamber.code": chamberCode,
                "condition.value": value,
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
}

function onRunningRecord(startDate, chamberCode, value) {
    return queue.aggregate([{
        $match: {
            endDate: {
                $gte: new Date(startDate),
            },
            "chamber.code": chamberCode,
            "condition.value": value,
        },
    }, ]);
}

function findOperateItem(code) {
    return operate_items.aggregate([{
        $match: {
            code: code,
        },
    }, ]);
}

function sumCountOperates(dataInRange, type) {
    return dataInRange.reduce((prev, now) => {
        return (prev += Number(now.operate[type]["qty"]));
    }, 0);
}

function createQueue(items) {
    return queue.create(items);
}

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    queue.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    queue.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;