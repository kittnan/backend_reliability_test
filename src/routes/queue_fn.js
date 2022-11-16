const queue = require("../models/queue");
const chamber_list = require("../models/chamber_list");
const operate_items = require("../models/operate-items");
module.exports = {
    test: function test() {
        return queue.find({})
    },
    checkStateChamber: function checkStateChamber(code, status) {
        return chamber_list
            .aggregate([{
                $match: {
                    code: code,
                    status: status,
                },
            }, ])
            .limit(1);
    },
    checkDate: function checkDate(startDate, endDate, chamberCode, value) {
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
    },
    onRunningRecord: function onRunningRecord(startDate, chamberCode, value) {
        return queue.aggregate([{
            $match: {
                endDate: {
                    $gte: new Date(startDate),
                },
                "chamber.code": chamberCode,
                "condition.value": value,
            },
        }, ]);
    },
    findOperateItem: function findOperateItem(code) {
        return operate_items.aggregate([{
            $match: {
                code: code,
            },
        }, ]);
    },
    sumCountOperates: function sumCountOperates(dataInRange, type) {
        return dataInRange.reduce((prev, now) => {
            return (prev += Number(now.operate[type]["qty"]));
        }, 0);
    },

    createQueue: function createQueue(items) {
        return queue.create(items);
    },
    checkLenDataNotZero: function checkLenDataNotZero(data) {
        return new Promise((resolve, reject) => {
            if (data && data.length != 0) resolve(true)
            reject(false)
        })
    }

}