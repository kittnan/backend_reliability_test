let express = require("express");
let router = express.Router();

const queue = require("../models/queue");
const chamber_list = require("../models/chamber_list");

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
    // res.json(req.body);
    insert(req.body);
    // queue.insertMany(req.body, (err, result) => {
    //     if (err) {
    //         res.json(err);
    //     } else {
    //         res.json(result);
    //     }
    // });
});

async function insert(data) {
    let result = [];
    for (let i = 0; i < data.length; i++) {
        const con_chamber = {
            startDate: data[i].startDate,
            endDate: data[i].endDate,
            qty: Number(data[i].work.qty),
            functionValue: data[i].condition.value,
            chamberCode: data[i].chamber.code,
        };
        const foo = await checkStateChamber(con_chamber.chamberCode, con_chamber.qty);
        console.log(foo);
        if (foo && foo.length === 1) {
            const foo2 = await checkDate(data[i].startDate, data[i].endDate);
            console.log('date', foo2);
        } else {
            res.json(false);
        }

        // const foo = await checkCap(con_chamber.chamberCode, con_chamber.qty);
        // console.log(foo);
        // if (foo.length === 1) {} else {
        //     result.push({
        //         controlNo: data[i].work.controlNo,
        //         function: data[i].condition.name,
        //         status: false,
        //     });
        // }
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

function checkDate(startDate, endDate) {
    return chamber_list.aggregate([{
        $match: {
            startDate: {
                $gte: new Date(startDate),
            },
            endDate: {
                $lte: new Date(endDate),
            },
        },
    }, ]);
}

function checkCap() {

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