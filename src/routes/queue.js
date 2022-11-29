let express = require("express");
let router = express.Router();

let fn = require("./queue_fn");

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

router.get("/formId/:requestId", (req, res, next) => {
    const { requestId } = req.params;
    queue
        .aggregate([{
            $match: {
                "work.requestId": requestId,
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

async function checkStateChamber(code, status) {
    return await chamber_list
        .aggregate([{
            $match: {
                code: code,
                status: status,
            },
        }, ])
        .limit(1);
}
router.post("/insert", async(req, res, next) => {
    queue.insertMany(req.body, (err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});
router.post("/check", async(req, res, next) => {
    let result = [];
    let data = req.body;
    try {
        for (let i = 0; i < data.length; i++) {
            const con = {
                startDate: data[i].startDate,
                endDate: data[i].endDate,
                qty: Number(data[i].work.qty),
                functionValue: data[i].condition.value,
                chamberCode: data[i].chamber.code,
                chamberStatus: true,
                status: data[i].status,
            };
            const r_chamber = await fn.checkStateChamber(
                con.chamberCode,
                con.chamberStatus
            );

            const r_qtyValid = await fn.qtyValid(
                con.startDate,
                con.chamberCode,
                data[i].condition.value,
                con.qty,
                r_chamber[0].capacity
            );

            const running = await fn.onRunningRecord(con.startDate, con.chamberCode);
            let run;
            let createStatus = false
            if (running.length > 0) {
                if (running.find((r) => Number(r.condition.value) == Number(data[i].condition.value))) {
                    run = running;
                    createStatus = true
                } else {
                    res.status(200).json('chamber function not match');
                }
            } else {
                run = [];
                createStatus = true
            }

            if (createStatus) {
                if (data[i].operate.checker && data[i].operate.checker.code) {
                    const checker = await fn.findOperateItem(data[i].operate.checker.code);
                    const checkerCount = fn.sumCountOperates(run, "checker");
                    const checkerState =
                        Number(checkerCount) <= Number(checker[0].qty) ? true : false;
                    await fn.checkOperateStatus(checkerState, "checker");
                }

                if (data[i].operate.power && data[i].operate.power.code) {
                    const power = await fn.findOperateItem(data[i].operate.power.code);
                    const powerCount = fn.sumCountOperates(run, "power");
                    const powerState =
                        Number(powerCount) <= Number(power[0].qty) ? true : false;
                    await fn.checkOperateStatus(powerState, "power");
                }

                if (data[i].operate.attachment && data[i].operate.attachment.code) {
                    const attachment = await fn.findOperateItem(
                        data[i].operate.attachment.code
                    );
                    const attachmentCount = fn.sumCountOperates(run, "attachment");
                    const attachmentState =
                        Number(attachmentCount) <= Number(attachment[0].qty) ? true : false;
                    await fn.checkOperateStatus(attachmentState, "attachment");
                }

                // const createObj = await fn.createQueue(data[i]);

                if (i + 1 === data.length) {
                    if (data[0].status == "draft") {
                        res.status(200).json({
                            status: true,
                            text: data,
                        });
                    } else {
                        res.status(200).json({
                            status: true,
                            text: "CREATE SUCCESS",
                        });
                    }
                }
            }


        }
    } catch (error) {
        console.log(error);
        await queue.deleteMany({
            "work.requestId": req.body[0].work.requestId,
        });
        res.status(200).json(error);
    }
});

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
router.put("/updateMany/", async(req, res, next) => {
    try {
        const data = req.body;
        for (let index = 0; index < data.length; index++) {
            await queue.updateOne({ _id: data[index]._id }, {
                $set: {
                    ...data[index],
                    status: "ready",
                },
            });
            if (index + 1 === data.length) {
                res.json({
                    status: true,
                });
            }
        }
    } catch (error) {
        res.status(200).json(error);
    }

    // queue.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
    //     if (err) {
    //         res.json(err);
    //     } else {
    //         res.json(result);
    //     }
    // });
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