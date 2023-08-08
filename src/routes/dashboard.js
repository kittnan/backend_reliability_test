let express = require("express");
let router = express.Router();
const moment = require("moment");
const QUEUES_MODEL = require("../models/queue");
const REQUEST_FORM_MODEL = require("../models/request_form");
const USERS_MODEL = require("../models/user");
const CHAMBER_LIST_MODEL = require("../models/chamber_list");
const OPERATE_ITEMS_MODEL = require("../models/operate-items");
const FORM_STEP3_PURPOSE_MODEL = require("../models/form-step2-testPurpose");
const ObjectId = require("mongodb").ObjectID;
const mongoose = require("mongoose");
// autoRunCalculateDashboard();
// function autoRunCalculateDashboard() {
//   var cron = require("node-cron");
//   cron.schedule("*/5 * * * * *", async function () {
//     console.log("running a task every 5 sec");
//     const requests = await requestOnDate();
//     const foo = await createCorporate(requests);
//     await DASHBOARD_CORPORATE_MODEL.create({
//       data: foo,
//       date: new Date(),
//     });

//     const foo2 = await createSection(requests);
//     await DASHBOARD_SECTION_MODEL.create({
//       data: foo2,
//       date: new Date(),
//     });

//     const foo3 = await createDaily(requests);
//     await DASHBOARD_DAILY_MODEL.create({
//       data: foo3,
//       date: new Date(),
//     });
//     // console.log("🚀 ~ foo3:", foo3);
//   });
// }
async function requestAtMoreDate(selectedDate) {
  try {
    const startDay = moment(selectedDate).startOf("day").toDate();
    const queues = await QUEUES_MODEL.aggregate([
      {
        $match: {
          endDate: {
            $gte: new Date(startDay),
          },
        },
      },
    ]);
    return queues.map((q) => ObjectId(q.work.requestId));
  } catch (error) {
    console.error(error);
  }
}
async function requestAtOnDate(selectedDate) {
  try {
    const startDay = moment(selectedDate).startOf("day").toDate();
    const endDay = moment(selectedDate).endOf("day").toDate();
    const queues = await QUEUES_MODEL.aggregate([
      {
        $match: {
          endDate: {
            $gte: new Date(startDay),
            $lte: new Date(endDay),
          },
        },
      },
    ]);
    return queues.map((q) => ObjectId(q.work.requestId));
  } catch (error) {
    console.error(error);
  }
}

async function createCorporate(requests) {
  const requestData = await REQUEST_FORM_MODEL.aggregate([
    {
      $match: {
        _id: {
          $in: requests,
        },
        status: {
          $nin: ["draft", "finish", "cancel"],
        },
      },
    },
  ]);
  const corporate = ["dst", "amt"];
  const corporateData = corporate.map((u) => {
    return {
      name: u,
      value: requestData.filter((d) => d.corporate === u).length,
    };
  });

  return corporateData;
}

async function createSection(requests) {
  const requestSection = await REQUEST_FORM_MODEL.aggregate([
    {
      $match: {
        _id: {
          $in: requests,
        },
        status: {
          $nin: ["draft", "finish", "cancel"],
        },
      },
    },
    {
      $lookup: {
        from: "formstep1details",
        localField: "controlNo",
        foreignField: "controlNo",
        as: "step1",
      },
    },
    {
      $project: {
        section: { $arrayElemAt: ["$step1.department", 0] },
      },
    },
  ]);
  const sections = requestSection.filter((d) => d.section !== undefined);
  if (sections && sections.length > 0) {
    let countSections = sections.reduce((prev, now) => {
      const foo = prev.find((p) => p.name === now.section);
      if (foo) {
        const index = prev.indexOf(foo);
        foo.value++;
        prev[index] = foo;
        return prev;
      } else {
        prev.push({
          name: now?.section,
          value: 1,
        });
        return prev;
      }
    }, []);
    countSections = countSections.sort((a, b) => b.value - a.value);
    return countSections;
  } else {
    const foo = [];
    return foo;
  }
}

async function createDaily(date) {
  try {
    const s = moment(date).startOf("day").toDate();
    const e = moment(date).endOf("day").toDate();
    const queues = await QUEUES_MODEL.aggregate([
      {
        $match: {
          inspectionTime: {
            $elemMatch: {
              endDate: {
                $gte: s,
                $lte: e,
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "request_forms",
          localField: "work.controlNo",
          foreignField: "controlNo",
          as: "result",
        },
      },
      {
        $lookup: {
          from: "formstep1details",
          localField: "work.requestId",
          foreignField: "requestId",
          as: "step1",
        },
      },
      {
        $lookup: {
          from: "formstep2testpurposes",
          localField: "work.requestId",
          foreignField: "requestId",
          as: "step2",
        },
      },
      {
        $lookup: {
          from: "formstep3testingtypes",
          localField: "work.requestId",
          foreignField: "requestId",
          as: "step3",
        },
      },
      {
        $lookup: {
          from: "formstep4testingconditions",
          localField: "work.requestId",
          foreignField: "requestId",
          as: "step4",
        },
      },

      {
        $project: {
          inspectionTime: "$inspectionTime",
          reportQE: "$reportQE",
          model: {
            $arrayElemAt: ["$step1.modelNo", 0],
          },
          size: {
            $arrayElemAt: ["$step1.size", 0],
          },
          customer: {
            $arrayElemAt: ["$step1.customer", 0],
          },
          purpose: {
            $arrayElemAt: ["$step2.purpose", 0],
          },
          testingType: {
            $arrayElemAt: ["$step3", 0],
          },
          testingCondition: {
            $arrayElemAt: ["$step4", 0],
          },
          userId: {
            $arrayElemAt: ["$result.userId", 0],
          },
          controlNo: "$work.controlNo",
        },
      },
    ]);

    const users = await USERS_MODEL.aggregate([{ $match: {} }]);
    const newQueue = queues.map((q) => {
      const now = q.inspectionTime.filter((time) => {
        const minOfDay = 1440;
        // const startDay = moment(new Date()).startOf("day");
        const diffDay = moment(time.startDate).diff(moment(date), "minute");
        const report = q.reportQE.find((qe) => qe.at === time.at);
        time["report"] = report ? true : false;
        if (diffDay <= minOfDay) return true;
        return false;
      });
      now.sort((a, b) => {
        return new Date(b.endDate) - new Date(a.endDate);
      });
      const user = users.find((u) => u._id == q.userId);
      return {
        ...q,
        schedule: now,
        userName: user ? user.name : null,
        userSection: user ? user.section : null,
        purpose: q.purpose,
      };
    });
    return newQueue;
  } catch (error) {
    console.log(error);
  }
}

async function createReport(date) {
  try {
    const s = moment(date).startOf("day").toDate();
    const e = moment(date).endOf("day").toDate();
    const queues = await QUEUES_MODEL.aggregate([
      {
        $match: {
          reportQE: {
            $elemMatch: {
              endDate: {
                $gte: s,
                $lte: e,
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "request_forms",
          localField: "work.controlNo",
          foreignField: "controlNo",
          as: "result",
        },
      },
      {
        $lookup: {
          from: "formstep1details",
          localField: "work.requestId",
          foreignField: "requestId",
          as: "step1",
        },
      },
      {
        $project: {
          reportQE: "$reportQE",
          model: {
            $arrayElemAt: ["$step1.modelNo", 0],
          },
          size: {
            $arrayElemAt: ["$step1.size", 0],
          },
          customer: {
            $arrayElemAt: ["$step1.customer", 0],
          },
          userId: {
            $arrayElemAt: ["$result.userId", 0],
          },
          controlNo: "$work.controlNo",
        },
      },
    ]);
    const users = await USERS_MODEL.aggregate([{ $match: {} }]);
    const newQueue = queues.map((q) => {
      const user = users.find((u) => u._id == q.userId);

      const nowQueue = q.reportQE.find(
        (r) => r?.endDate && moment(r?.endDate).isBetween(moment(s), moment(e))
      );
      return {
        ...q,
        userName: user ? user.name : null,
        userSection: user ? user.section : null,
        nowAt: nowQueue?.at,
      };
    });
    const uni = [
      ...new Map(newQueue.map((item) => [item["controlNo"], item])).values(),
    ];
    return uni;
  } catch (error) {
    console.log(error);
  }
}

async function createChamber(date) {
  const s = moment(date).startOf("day").toDate();
  const queues = await QUEUES_MODEL.aggregate([
    {
      $match: {
        endDate: {
          $gte: s,
        },
      },
    },
  ]);

  let chambers = await CHAMBER_LIST_MODEL.aggregate([
    {
      $match: {},
    },
  ]);
  chambers = chambers.map((c) => {
    const findItem = queues.filter((q) => q?.chamber?.code == c.code);
    return {
      ...c,
      queue: findItem.length != 0 ? findItem : [],
    };
  });

  const mapChamber = chambers.map((c) => {
    const use = c.queue.reduce((prev, now) => {
      return (prev += now.work.qty);
    }, 0);
    return {
      ...c,
      capacity: Number(c.capacity),
      use: use,
      usedPercent: `${((use / Number(c.capacity)) * 100).toFixed(2)}%`,
    };
  });
  return mapChamber;
}

async function createOperate(date) {
  try {
    const s = moment(date).startOf("day").toDate();
    const operateItems = await OPERATE_ITEMS_MODEL.aggregate([
      {
        $match: {
          status: "ready",
        },
      },
    ]);
    const queues = await QUEUES_MODEL.aggregate([
      {
        $match: {
          endDate: {
            $gte: s,
          },
        },
      },
    ]);
    const newOperate = operateItems.map((o) => {
      return {
        ...o,
        queue: loopQueue(queues, o.type, o.code),
      };
    });
    return newOperate;
  } catch (error) {
    console.log(error);
  }
}
function loopQueue(queues, operateType, code) {
  const queueFilter = queues.filter((q) => {
    if (
      q.operate.status &&
      q.operate[operateType] &&
      q.operate[operateType].code === code
    ) {
      return true;
    }
    return false;
  });
  const newQueue = queueFilter.map((q) => {
    return {
      controlNo: q.work.controlNo,
      chamber:
        q.chamber && q.chamber.code
          ? `${q.chamber?.code}( ${q.chamber?.name} )`
          : "No Select Chamber",
      qty: q.operate[operateType].qty,
      endDate: q.endDate,
    };
  });
  return newQueue;
}

async function createTestingPurpose(requests) {
  try {
    const requestData = await REQUEST_FORM_MODEL.aggregate([
      {
        $match: {
          _id: {
            $in: requests,
          },
          status: {
            $nin: ["draft", "finish", "cancel"],
          },
        },
      },
    ]);
    const requestFilter = requestData.map((a) => a._id.toString());
    const onlyDistinct = await FORM_STEP3_PURPOSE_MODEL.aggregate([
      {
        $match: {
          requestId: {
            $in: requestFilter,
          },
        },
      },
      {
        $group: {
          _id: {
            purpose: "$purpose",
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);
    return onlyDistinct;
  } catch (error) {
    console.log(error);
  }
}
router.get("/corporate", async (req, res, next) => {
  try {
    const { date } = req.query;
    const requests = await requestAtMoreDate(date);
    const query = await createCorporate(requests);
    res.json(query);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
router.get("/section", async (req, res, next) => {
  try {
    const { date } = req.query;
    const requests = await requestAtMoreDate(date);
    const query = await createSection(requests);
    res.json(query);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
router.get("/daily", async (req, res, next) => {
  try {
    const { date } = req.query;
    const query = await createDaily(date);
    res.json(query);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
router.get("/report", async (req, res, next) => {
  try {
    const { date } = req.query;
    const query = await createReport(date);
    res.json(query);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
router.get("/chamber", async (req, res, next) => {
  try {
    const { date } = req.query;
    const query = await createChamber(date);
    res.json(query);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
router.get("/operate", async (req, res, next) => {
  try {
    const { date } = req.query;
    const query = await createOperate(date);
    res.json(query);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
router.get("/testPurpose", async (req, res, next) => {
  try {
    const { date } = req.query;
    const requests = await requestAtMoreDate(date);
    const query = await createTestingPurpose(requests);
    res.json(query);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

module.exports = router;
