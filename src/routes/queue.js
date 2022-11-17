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

            const running = await fn.onRunningRecord(
                con.startDate,
                con.chamberCode,
                data[i].condition.value
            );

            const checker = await fn.findOperateItem(data[i].operate.checker.code);
            const checkerCount = fn.sumCountOperates(running, "checker");
            const checkerState =
                Number(checkerCount) <= Number(checker[0].qty) ? true : false;
            await fn.checkOperateStatus(checkerState, "checker");

            const power = await fn.findOperateItem(data[i].operate.power.code);
            const powerCount = fn.sumCountOperates(running, "power");
            const powerState =
                Number(powerCount) <= Number(power[0].qty) ? true : false;
            await fn.checkOperateStatus(powerState, "power");

            const attachment = await fn.findOperateItem(
                data[i].operate.attachment.code
            );
            const attachmentCount = fn.sumCountOperates(running, "attachment");
            const attachmentState =
                Number(attachmentCount) <= Number(attachment[0].qty) ? true : false;
            await fn.checkOperateStatus(attachmentState, "attachment");
            const createObj = await fn.createQueue(data[i]);

            if (i + 1 === data.length) {
                res.status(200).json({
                    status: true,
                    text: "CREATE SUCCESS",
                });
            }
        }
    } catch (error) {
        await queue.deleteMany({
            "work.requestId": req.body[0].work.requestId,
        });
        error.text = error.text.toUpperCase()
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