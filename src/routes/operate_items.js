let express = require("express");
let router = express.Router();

const operate_items = require("../models/operate-items");
const operate_group = require("../models/operate-group");
const queue = require("../models/queue");

router.get("", (req, res, next) => {
    operate_items.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.get("/remain", async(req, res, next) => {
    const { startDate } = req.query;
    const operateItems = await operate_items
        .aggregate([{ $match: {} }])
        .sort({ type: -1 });
    // res.json(operateItems);
    const mapOperateItems = await loop1(operateItems, startDate);
    res.json(mapOperateItems);
});

router.get("/condition", async(req, res, next) => {
    const { startDate } = req.query;
    const operateItems = await operate_items
        .aggregate([{ $match: {} }])
        .sort({ type: -1 });
    console.log("1", startDate);
    const mapOperateItems = await loop1(operateItems, startDate);

    const groupOperate = await operate_group.aggregate([{ $match: {} }]);

    const foo = await loopGroupOperate(groupOperate, mapOperateItems);
    res.json(foo);
});

async function loop1(items, startDate) {
    let arr = [];
    for (let i = 0; i < items.length; i++) {
        console.log("2", startDate);

        arr.push(await loopOperateItems(items[i], startDate));
        if (i + 1 == items.length) {
            return arr;
        }
    }
}

async function loopOperateItems(item, startDate) {
    console.log("3", startDate);
    const queueList = await queue.aggregate([{
        $match: {
            $or: [{
                    "operate.attachment.code": item.code,
                },
                {
                    "operate.checker.code": item.code,
                },
                {
                    "operate.power.code": item.code,
                },
            ],
            endDate: {
                $gte: new Date(startDate),
            },
        },
    }, ]);
    // console.log(queueList);
    const use = queueList.reduce((prev, q) => {
        const temp_use = q.operate[item.type].qty || 0;
        return (prev += temp_use);
    }, 0);
    return {
        ...item,
        use: use,
        remain: item.stock - use,
    };
}

async function loopGroupOperate(groups, mapOperateItems) {
    return new Promise((resolve) => {
        let temp = [];
        for (let i = 0; i < groups.length; i++) {
            const foo = loopOperate(groups[i].operate, mapOperateItems);
            temp.push({
                ...groups[i],
                operate: foo,
            });
            if (i + 1 == groups.length) {
                resolve(temp);
            }
        }
    });
}

function loopOperate(operates, mapOperateItems) {
    let temp = [];
    for (let i = 0; i < operates.length; i++) {
        const foo = newOperate(operates[i], mapOperateItems);
        temp.push(foo);
        if (i + 1 == operates.length) {
            return temp;
        }
    }
}

function newOperate(operate, mapOperateItems) {
    const attachmentFind = mapOperateItems.find(
        (o) => o.code == operate["attachment"].code
    );
    const checkerFind = mapOperateItems.find(
        (o) => o.code == operate["checker"].code
    );
    const powerFind = mapOperateItems.find(
        (o) => o.code == operate["power"].code
    );
    return {
        attachment: {
            ...operate["attachment"],
            use: attachmentFind ? attachmentFind.use : 0,
        },
        checker: {
            ...operate["checker"],
            use: checkerFind ? checkerFind.use : 0,
        },
        power: {
            ...operate["power"],
            use: powerFind ? powerFind.use : 0,
        },
    };
}

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
                code: code,
            },
            $count: "count",
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