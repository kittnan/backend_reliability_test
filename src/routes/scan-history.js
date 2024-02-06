let express = require("express");
let router = express.Router();

const SCAN_HISTORY = require("../models/scan-history");
const moment = require("moment");

router.get("", async (req, res, next) => {
  try {
    let { runNo, code, status, conditionValue, conditionName } = req.query;
    let con = [
      {
        $match: {},
      },
    ];
    if (runNo) {
      runNo = JSON.parse(runNo);
      console.log("🚀 ~ runNo:", runNo)
      con.push({
        $match: {
          runNo: {
            $in: runNo,
          },
        },
      });
    }
    if (code) {
      code = JSON.parse(code);
      con.push({
        $match: {
          code: {
            $in: code,
          },
        },
      });
    }
    if (conditionValue) {
      conditionValue = JSON.parse(conditionValue);
      con.push({
        $match: {
          "condition.value": {
            $in: conditionValue,
          },
        },
      });
    }
    if (conditionName) {
      conditionName = JSON.parse(conditionName);
      con.push({
        $match: {
          "condition.name": {
            $in: conditionName,
          },
        },
      });
    }
    if (code) {
      code = JSON.parse(code);
      con.push({
        $match: {
          code: {
            $in: code,
          },
        },
      });
    }
    if (status) {
      status = JSON.parse(status);
      con.push({
        $match: {
          status: {
            $in: status,
          },
        },
      });
    }
    con.push({
      '$lookup': {
        'from': 'queues',
        'localField': 'runNo',
        'foreignField': 'work.controlNo',
        'as': 'queues'
      }
    })

    const data = await SCAN_HISTORY.aggregate(con);
    res.json(data);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});
router.get("/hold", async (req, res, next) => {
  try {
    let con = [
      {
        $match: {}
      }
    ]
    con.push({
      '$lookup': {
        'from': 'queues',
        'localField': 'runNo',
        'foreignField': 'work.controlNo',
        'as': 'queues'
      }
    })
    con.push({
      $project: {
        controlNo: "$runNo",
        at: "$at",
        code: "$code",
        conditionName: "$condition.name",
        conditionValue: "$condition.value",
        status: "$status",
        queues: "$queues"
      }
    })
    const resData = await SCAN_HISTORY.aggregate(con)
    const mapData = resData.map(item => {
      const queue = item.queues.find(queue => {
        return queue.condition.value == item.conditionValue && queue.work.controlNo == item.controlNo
      })
      delete item.queues
      return {
        ...item,
        startDate: queue.startDate,
        endDate: queue.endDate,

      }
    })
    let dataOnlyHolding = mapData.filter(item => {
      if (mapData.some(item2 => item2.code == item.code && item2.conditionName == item.conditionName && item2.at == item.at && item2.controlNo == item.controlNo && item2.status != item.status)) {
        return true
      }
      return false
    }).filter(item => item.status == 'in')
    dataOnlyHolding = dataOnlyHolding.map(item => {
      const start = moment(item.startDate)
      const end = moment(item.endDate)
      const now = moment()
      if (now.isBetween(start, end)) {
        const diff = end.diff(now,'day')
        item.statusText = diff
      }
      return item
    })
    res.json(dataOnlyHolding)
  } catch (error) {
    console.log("🚀 ~ error:", error)
    res.sendStatus(500)
  }
})

router.post("/insert", async (req, res, next) => {
  try {
    const data = await SCAN_HISTORY.insertMany(req.body);
    res.json(data);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  SCAN_HISTORY.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  SCAN_HISTORY.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
