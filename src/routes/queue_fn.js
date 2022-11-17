const queue = require("../models/queue");
const chamber_list = require("../models/chamber_list");
const operate_items = require("../models/operate-items");
module.exports = {

    checkStateChamber: async function checkStateChamber(code, status) {
        return new Promise(async(resolve, reject) => {
            const foo = await chamber_list
                .aggregate([{
                    $match: {
                        code: code,
                        status: status,
                    },
                }, ])
                .limit(1);
            if (foo && foo.length > 0) {
                resolve(foo);
            } else {
                reject({
                    status: false,
                    text: `chamber ${code} not ready`,
                });
            }
        });
    },
    qtyValid: function qtyValid(startDate, chamberCode, value, qty, cap) {
        return new Promise(async(resolve, reject) => {
            const foo = await queue.aggregate([{
                    $match: {
                        endDate: {
                            $gte: new Date(startDate),
                        },
                        "chamber.code": chamberCode,
                        "condition.value": value.toString(),
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

            if (foo && foo.length > 0) {
                const use = foo[0].total ? Number(qty) + foo[0].total : Number(qty);
                if (use <= cap) {
                    resolve(true);
                } else {
                    reject({
                        status: false,
                        text: `qty full`,
                    });
                }
            } else {
                resolve(true);
            }
        });
    },
    onRunningRecord: function onRunningRecord(startDate, chamberCode, value) {
        return queue.aggregate([{
            $match: {
                endDate: {
                    $gte: new Date(startDate),
                },
                "chamber.code": chamberCode,
                "condition.value": value.toString(),
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

    checkOperateStatus: function checkOperateStatus(status, type) {
        return new Promise((resolve, reject) => {
            if (status) {
                resolve(true);
            } else {
                reject({
                    status: false,
                    text: `${type} not ready`,
                });
            }
        });
    },

    createQueue: function createQueue(items) {
        return queue.create(items);
    },

    checkLenDataNotZero: function checkLenDataNotZero(data) {
        return new Promise((resolve, reject) => {
            if (data && data.length != 0) resolve(true);
            reject(false);
        });
    },
};