let express = require("express");
let router = express.Router();

let fn = require("./queue_fn");

const QUEUES_REVISES = require("../models/queue-revises");
const chamber_list = require("../models/chamber_list");
const queue = require("../models/queue");

router.get("", (req, res, next) => {
  QUEUES_REVISES.find({}).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.get("/formId/:requestId", (req, res, next) => {
  const { requestId } = req.params;
  QUEUES_REVISES.aggregate([
    {
      $match: {
        "work.requestId": requestId,
      },
    },
  ]).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

async function checkStateChamber(code, status) {
  return await chamber_list
    .aggregate([
      {
        $match: {
          code: code,
          status: status,
        },
      },
    ])
    .limit(1);
}
router.post("/insert", async (req, res, next) => {
  await QUEUES_REVISES.deleteMany({
    "work.controlNo": req.body[0].work.controlNo,
  });
  QUEUES_REVISES.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});
router.post("/check", async (req, res, next) => {
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
      let createStatus = false;
      if (running.length > 0) {
        if (
          running.find(
            (r) => Number(r.condition.value) == Number(data[i].condition.value)
          )
        ) {
          run = running;
          createStatus = true;
        } else {
          res.status(200).json("chamber function not match");
        }
      } else {
        run = [];
        createStatus = true;
      }

      if (createStatus) {
        if (data[i].operate.checker && data[i].operate.checker.code) {
          const checker = await fn.findOperateItem(
            data[i].operate.checker.code
          );
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
    await QUEUES_REVISES.deleteMany({
      "work.requestId": req.body[0].work.requestId,
    });
    res.status(200).json(error);
  }
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  QUEUES_REVISES.updateMany({ _id: id }, { $set: req.body }).exec(
    (err, result) => {
      if (err) {
        res.json(err);
      } else {
        res.json(result);
      }
    }
  );
});
router.put("/updateMany/", async (req, res, next) => {
  try {
    const data = req.body;
    for (let index = 0; index < data.length; index++) {
      await QUEUES_REVISES.updateOne(
        { _id: data[index]._id },
        {
          $set: {
            ...data[index],
            status: "ready",
          },
        }
      );
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
  QUEUES_REVISES.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.get("/chamber/ready", async (req, res, next) => {
  const { value, startDate, qty } = req.query;
  let valueArray = JSON.parse(value);
  try {
    // const { value, startDate, qty } = req.params;
    const chamber = await chamber_list.aggregate([
      {
        $match: {
          "function.value": {
            $in: valueArray,
          },
        },
      },
    ]);
    // res.json(chamber);
    const codes = await mapChamberCode(chamber);
    const r_queue = await findChamberQueue(codes, startDate);
    const remain = await findChamberQueueNoGroup(codes, startDate);
    const r_mapChamber = await mapChamber(chamber, r_queue, remain, qty);
    const freeChamber = await filterChamber(r_mapChamber);
    const r_mapCondition = await mapCondition(freeChamber, valueArray);
    res.json(r_mapCondition);
  } catch (error) {
    console.log("🚀 ~ error:", error);
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
    const r_queue = queue.aggregate([
      {
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
      .aggregate([
        {
          $match: {
            endDate: {
              $gte: new Date(startDate),
            },
            "chamber.code": {
              $in: codes,
            },
          },
        },
      ])
      .sort({ endDate: 1 });
    resolve(r_queue);
  });
}

function mapChamber(chamber, r_queue, remain, qty) {
  return new Promise((resolve) => {
    resolve(
      chamber.map((c) => {
        const foundItem = r_queue.find((q) => q._id == c.code)
          ? r_queue.find((q) => q._id == c.code)
          : {
              total: 0,
            };
        let freeCap = Number(c.capacity) - Number(foundItem.total);
        let temp = { ...c };

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
    const newChamber = chamber.map((c) => {
      if (c?.remain?.length == 0) {
        return {
          ...c,
          status: true,
        };
      } else if (c?.remain?.length > 0) {
        // c?.remain?.find((r) => {
        const r = c.remain[0];
        const v1 = Number(r.condition.value);
        const foundItem = value.find((v) => v == v1);
        if (foundItem) {
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
        // });
      } else
        return {
          ...c,
          status: false,
        };
    });
    resolve(newChamber);
  });
}

module.exports = router;
