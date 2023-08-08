let express = require("express");
let router = express.Router();

const request_form = require("../models/request_form");
const formStep1Detail = require("../models/form-step1-detail");
const formStep2TestPurpose = require("../models/form-step2-testPurpose");
const formStep3TestingType = require("../models/form-step3-testingType");
const formStep4TestingCondition = require("../models/form-step4-testingCondition");
const formStep5UserApprove = require("../models/form-step5-userApprove");
const userModel = require("../models/user");
const queue = require("../models/queue");
const logFlow = require("../models/log_flow");
const chamber_list = require("../models/chamber_list");
const operate_item = require("../models/operate-items");
const backup_request = require("../models/backup-request");
const moment = require("moment");

const ObjectId = require("mongodb").ObjectID;

router.get("", (req, res, next) => {
  request_form.find({}).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

// TODO get data by id and lookup all
router.get("/id/:id", (req, res, next) => {
  const { id } = req.params;

  const condition = [
    {
      $match: {
        _id: ObjectId(id),
      },
    },
    {
      $project: {
        _id: {
          $toString: "$_id",
        },
        status: "$status",
        table: "$table",
        nextApprove: "$nextApprove",
        level: "$level",
        comment: "$comment",
        qeReceive: "$qeReceive",
        followUp: "$followUp",
      },
    },
    {
      $lookup: {
        from: "formstep1details",
        localField: "_id",
        foreignField: "requestId",
        as: "step1",
      },
    },
    {
      $lookup: {
        from: "formstep2testpurposes",
        localField: "_id",
        foreignField: "requestId",
        as: "step2",
      },
    },
    {
      $lookup: {
        from: "formstep3testingtypes",
        localField: "_id",
        foreignField: "requestId",
        as: "step3",
      },
    },
    {
      $lookup: {
        from: "formstep4testingconditions",
        localField: "_id",
        foreignField: "requestId",
        as: "step4",
      },
    },
    {
      $lookup: {
        from: "formstep5userapproves",
        localField: "_id",
        foreignField: "requestId",
        as: "step5",
      },
    },
    {
      $lookup: {
        from: "request_revises",
        localField: "_id",
        foreignField: "requestId",
        as: "request_revises",
      },
    },
    {
      $lookup: {
        from: "queues",
        localField: "_id",
        foreignField: "work.requestId",
        as: "queues",
      },
    },
    {
      $project: {
        step1: { $arrayElemAt: ["$step1", 0] },
        step2: { $arrayElemAt: ["$step2", 0] },
        step3: { $arrayElemAt: ["$step3", 0] },
        step4: { $arrayElemAt: ["$step4", 0] },
        request_revises: { $arrayElemAt: ["$request_revises", 0] },
        step5: "$step5",
        status: "$status",
        table: "$table",
        nextApprove: "$nextApprove",
        queues: "$queues",
        level: "$level",
        comment: "$comment",
        qeReceive: "$qeReceive",
        followUp: "$followUp",
      },
    },
  ];

  request_form.aggregate(condition).exec((err, result) => {
    if (err) res.json(err);
    res.json(result);
  });
});

// TODO get to table
router.get("/table/:userId/:status", async (req, res, next) => {
  const { userId, status } = req.params;
  //   console.log(userId);
  const newStatus = JSON.parse(status);
  const approve = await formStep5UserApprove.aggregate([
    {
      $match: {
        $or: [
          {
            "nextUser._id": userId,
          },
          {
            "prevUser._id": userId,
          },
        ],
      },
    },
  ]);
  const requestId = approve.map((ap) => ap.requestId);
  //   console.log(requestId);
  const condition = [
    {
      $project: {
        requestId: {
          $toString: "$_id",
        },
        status: "$status",
        nextApprove: "$nextApprove",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
      },
    },
    {
      $match: {
        requestId: {
          $in: requestId,
        },
        status: {
          $in: newStatus,
        },
      },
    },
    {
      $lookup: {
        from: "formstep1details",
        localField: "requestId",
        foreignField: "requestId",
        as: "step1",
      },
    },
    {
      $lookup: {
        from: "formstep5userapproves",
        localField: "requestId",
        foreignField: "requestId",
        as: "step5",
      },
    },
    {
      $project: {
        requestId: "$requestId",
        controlNo: { $arrayElemAt: ["$step1.controlNo", 0] },
        lotNo: { $arrayElemAt: ["$step1.lotNo", 0] },
        modelNo: { $arrayElemAt: ["$step1.modelNo", 0] },
        step5: "$step5",
        status: "$status",
        nextApprove: "$nextApprove",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
      },
    },
  ];

  request_form
    .aggregate(condition)
    .sort({ createdAt: -1 })
    .exec((err, result) => {
      // console.log(err, result);
      if (err) res.json(err);
      res.json(result);
    });
});

router.get("/tableShowCount", async (req, res, next) => {
  const { userId, status } = req.query;
  let conStatus = {};
  if (status && status == "ongoing") {
    conStatus = {
      status: {
        $nin: ["cancel", "finish"],
      },
    };
  }
  if (status && status == "finish") {
    conStatus = {
      status: {
        $in: ["finish", "closed"],
      },
    };
  }
  if (status && status == "all") {
    conStatus = {};
  }
  const approve = await formStep5UserApprove.aggregate([
    {
      $match: {
        $or: [
          {
            "nextUser._id": userId,
          },
          {
            "prevUser._id": userId,
          },
        ],
      },
    },
  ]);
  const requestId = approve.map((ap) => ap.requestId);
  const unique = [...new Set(requestId.map((item) => ObjectId(item)))];
  const form = await request_form.aggregate([
    {
      $match: {
        _id: {
          $in: unique,
        },
      },
    },
    {
      $match: conStatus,
    },
    {
      $count: "count",
    },
  ]);
  res.json(form);
});

router.get("/tableShowAdmin", async (req, res, next) => {
  const { status } = req.query;

  let conStatus = {};
  const start = moment().startOf("day").toISOString();
  const end = moment().endOf("day").toISOString();
  if (status && status == "ongoing") {
    conStatus = {
      status: {
        $nin: ["cancel", "finish"],
      },
    };
  }
  if (status && status == "finish") {
    conStatus = {
      status: {
        $in: ["finish", "closed"],
      },
    };
  }
  if (status && status == "all") {
    conStatus = {};
  }
  const condition = [
    {
      $project: {
        requestId: {
          $toString: "$_id",
        },
        status: "$status",
        nextApprove: "$nextApprove",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
        followUp: "$followUp",
      },
    },
    {
      $match: conStatus,
    },
    {
      $lookup: {
        from: "formstep1details",
        localField: "requestId",
        foreignField: "requestId",
        as: "step1",
      },
    },
    {
      $lookup: {
        from: "queues",
        localField: "requestId",
        foreignField: "work.requestId",
        as: "queues",
      },
    },
    {
      $lookup: {
        from: "formstep5userapproves",
        localField: "requestId",
        foreignField: "requestId",
        as: "step5",
      },
    },
    {
      $lookup: {
        from: "formstep2testpurposes",
        localField: "requestId",
        foreignField: "requestId",
        as: "step2",
      },
    },

    {
      $project: {
        requestId: "$requestId",
        controlNo: { $arrayElemAt: ["$step1.controlNo", 0] },
        lotNo: { $arrayElemAt: ["$step1.lotNo", 0] },
        modelNo: { $arrayElemAt: ["$step1.modelNo", 0] },
        requestSubject: { $arrayElemAt: ["$step1.requestSubject", 0] },
        step5: "$step5",
        status: "$status",
        nextApprove: "$nextApprove",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
        queues: "$queues",
        followUp: "$followUp",
        purpose: { $arrayElemAt: ["$step2", 0] },
      },
    },
  ];
  try {
    const request = await request_form
      .aggregate(condition)
      .sort({ createdAt: -1 });

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json(err);
  }

  // request_form
  //   .aggregate(condition)
  //   .sort({ createdAt: -1 })
  //   .exec((err, result) => {
  //     if (err) {
  //       // console.log(err);
  //       res.status(500).json(err);
  //     } else {
  //       res.status(200).json(result);
  //     }
  //   });
});
router.get("/tableShow", async (req, res, next) => {
  const { userId, status, section } = req.query;
  // console.log(section);
  let newSection = [];
  let sectionCon = {
    $match: {},
  };
  newSection = JSON.parse(section);
  if (newSection && newSection.length != 0) {
    sectionCon = {
      $match: {
        "step1.department": {
          $in: newSection,
        },
      },
    };
  }

  // console.log(sectionCon);

  const approve = await formStep5UserApprove.aggregate([
    {
      $match: {
        $or: [
          {
            "nextUser._id": userId,
          },
          {
            "prevUser._id": userId,
          },
        ],
      },
    },
  ]);

  const requestId = approve.map((ap) => ap.requestId);
  const unique = [...new Set(requestId.map((item) => item))];
  let conStatus = {};
  if (status && status == "ongoing") {
    conStatus = {
      status: {
        $nin: ["cancel", "finish"],
      },
    };
  }
  if (status && status == "finish") {
    conStatus = {
      status: {
        $in: ["finish", "closed"],
      },
    };
  }
  if (status && status == "all") {
    conStatus = {};
  }
  if (status && status == "revises") {
    conStatus = {
      status: {
        $in: ["qe_window_person_report"],
      },
    };
  }
  const condition = [
    {
      $project: {
        requestId: {
          $toString: "$_id",
        },
        level: "$level",
        status: "$status",
        nextApprove: "$nextApprove",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
        followUp: "$followUp",
      },
    },
    {
      $match: {
        requestId: {
          $in: unique,
        },
      },
    },
    {
      $match: conStatus,
    },
    {
      $lookup: {
        from: "formstep1details",
        localField: "requestId",
        foreignField: "requestId",
        as: "step1",
      },
    },
    sectionCon,
    {
      $lookup: {
        from: "queues",
        localField: "requestId",
        foreignField: "work.requestId",
        as: "queues",
      },
    },
    {
      $lookup: {
        from: "formstep5userapproves",
        localField: "requestId",
        foreignField: "requestId",
        as: "step5",
      },
    },
    {
      $lookup: {
        from: "formstep2testpurposes",
        localField: "requestId",
        foreignField: "requestId",
        as: "step2",
      },
    },
    {
      $lookup: {
        from: "request_revises",
        localField: "requestId",
        foreignField: "requestId",
        as: "request_revises",
      },
    },

    {
      $project: {
        requestId: "$requestId",
        controlNo: { $arrayElemAt: ["$step1.controlNo", 0] },
        section: { $arrayElemAt: ["$step1.department", 0] },
        lotNo: { $arrayElemAt: ["$step1.lotNo", 0] },
        modelNo: { $arrayElemAt: ["$step1.modelNo", 0] },
        requestSubject: { $arrayElemAt: ["$step1.requestSubject", 0] },
        step5: "$step5",
        level: "$level",
        status: "$status",
        nextApprove: "$nextApprove",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
        queues: "$queues",
        followUp: "$followUp",
        purpose: { $arrayElemAt: ["$step2", 0] },
        request_revise: { $arrayElemAt: ["$request_revises", 0] },
      },
    },
  ];

  request_form
    .aggregate(condition)
    .sort({ createdAt: -1 })
    .exec((err, result) => {
      if (err) {
        // console.log(err);
        res.status(500).json(err);
      } else {
        res.status(200).json(result);
      }
    });
});
// TODO get to table manage
router.get(
  "/tableManage/:userId/:status/:limit/:skip/:sort/:count",
  async (req, res, next) => {
    const { userId, status, limit, skip, sort, count } = req.params;
    // console.log(req.params);
    const newStatus = JSON.parse(status);
    // console.log(newStatus);

    let approve = await formStep5UserApprove.aggregate([
      {
        $match: {
          userId: userId,
        },
      },
    ]);

    res.json(approve);
  }
);

router.get("/condition/:userId/:status", (req, res, next) => {
  let { userId, status } = req.params;
  status = JSON.parse(status);
  const condition = [
    {
      $match: {
        userId: userId,
        status: {
          $in: status,
        },
      },
    },
    {
      $project: {
        _id: {
          $toString: "$_id",
        },
      },
    },
    {
      $lookup: {
        from: "formstep1details",
        localField: "_id",
        foreignField: "requestId",
        as: "step1",
      },
    },
    {
      $lookup: {
        from: "formstep2testpurposes",
        localField: "_id",
        foreignField: "requestId",
        as: "step2",
      },
    },
    {
      $lookup: {
        from: "formstep3testingtypes",
        localField: "_id",
        foreignField: "requestId",
        as: "step3",
      },
    },
    {
      $lookup: {
        from: "formstep4testingconditions",
        localField: "_id",
        foreignField: "requestId",
        as: "step4",
      },
    },
    {
      $lookup: {
        from: "formstep5userapproves",
        localField: "_id",
        foreignField: "requestId",
        as: "step5",
      },
    },
  ];
  request_form.aggregate(condition).exec((err, result) => {
    if (err) res.json(err);
    res.json(result);
  });
});

router.post("/getByCondition/", (req, res, next) => {
  const payload = req.body;
  let match = {
    $match: {},
  };
  if (payload && payload.action && payload.status) {
    if (payload.action == "nin") {
      const temp = {
        status: {
          $nin: payload.status,
        },
      };
      match["$match"] = {
        ...temp,
        ...match["$match"],
      };
    }
    if (payload.action == "in") {
      const temp = {
        status: {
          $in: payload.status,
        },
      };
      match["$match"] = {
        ...temp,
        ...match["$match"],
      };
    }
    if (payload.action == "all") {
      match["$match"] = {};
    }
  }

  if (payload && payload._id) {
    const temp = {
      userId: payload._id,
    };
    match["$match"] = {
      ...temp,
      ...match["$match"],
    };
  }
  // console.log(match);
  request_form.aggregate([{ ...match }]).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

// !new
router.post("/draft", async (req, res, next) => {
  let payload = req.body;
  // console.log(payload);
  const resultDuplicate = await checkDuplicateRequestNo(payload.controlNo);
  // console.log("🚀 ~ resultDuplicate:", resultDuplicate);
  let newControlNo = "";
  if (resultDuplicate.length === 0) {
    newControlNo = payload.controlNo;
  } else {
    const splitStr = payload.controlNo.split("-");
    // console.log("🚀 ~ splitStr:", splitStr);
    const lastRecord = await request_form
      .aggregate([
        {
          $match: {
            corporate: splitStr[0].toLowerCase(),
          },
        },
      ])
      .sort({ createdAt: -1 })
      .limit(1);
    const oldControlNo = lastRecord[0].controlNo.split("-")[3];
    const oldControlNoNum = Number(oldControlNo) + 1;
    let oldControlNoStr = oldControlNoNum.toString();
    oldControlNoStr = oldControlNoStr.padStart(3, "0");
    newControlNo = `${splitStr[0]}-${splitStr[1]}-${splitStr[2]}-${oldControlNoStr}-${splitStr[4]}`;
    payload.controlNo = newControlNo;
    // console.log("🚀 ~ newControlNo:", newControlNo);
    // console.log("payload.controlNo", payload.controlNo);
  }
  const createRequestFormResult = await request_form.insertMany(payload);
  // console.log("🚀 ~ createRequestFormResult:", createRequestFormResult);
  res.json(createRequestFormResult);
});

// !new

// TODO remain
router.get("/corporateRemain", async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const queues = await queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
  ]);
  const requestId = queues.map((q) => ObjectId(q.work.requestId));
  const requestData = await request_form.aggregate([
    {
      $match: {
        _id: {
          $in: requestId,
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
  res.json(corporateData);
});

router.get("/sectionRemain", async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const queues = await queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
  ]);
  const requestId = queues.map((q) => ObjectId(q.work.requestId));
  const requestData = await request_form.aggregate([
    {
      $match: {
        _id: {
          $in: requestId,
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
  // console.log("requestData", requestData);
  const sections = requestData.filter((d) => d.section !== undefined);

  // const sections = await loopFindUser(requestData);
  if (sections && sections.length > 0) {
    const countSections = sections.reduce((prev, now) => {
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
    res.json(countSections);
  } else {
    res.json([]);
  }
});

async function loopFindUser(requestData) {
  let arr = [];
  for (let i = 0; i < requestData.length; i++) {
    const user = await userModel.aggregate([
      {
        $match: {
          _id: ObjectId(requestData[i].userId),
        },
      },
      {
        $project: {
          section: "$section",
        },
      },
    ]);
    // console.log(user);
    user.length != 0 ? arr.push(user[0]) : false;
    if (i + 1 === requestData.length) return arr;
  }
}

router.get("/dailyRemain", async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const startDateNew = moment(startDate).startOf("day").toLocaleString();
  const newEndDate = moment(endDate).endOf("day").toLocaleString();
  // const ff = moment(startDate).startOf("day").toLocaleString();
  // console.log(startDateNew, endDate);
  // const startDate = moment().startOf("day").toLocaleString();
  // const endDate = moment().endOf("day").toLocaleString();
  const queues = await queue.aggregate([
    {
      $match: {
        inspectionTime: {
          $elemMatch: {
            endDate: {
              $gte: new Date(startDateNew),
              // $lte: new Date(newEndDate),
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

  const users = await userModel.aggregate([{ $match: {} }]);
  // res.json(users);
  const newQueue = queues.map((q) => {
    const now = q.inspectionTime.filter((time) => {
      const minOfDay = 1440;
      // const startDay = moment(new Date()).startOf("day");
      const diffDay = moment(time.startDate).diff(
        moment(startDateNew),
        "minute"
      );
      // console.log("🚀 ~ diffDay:", diffDay);
      // const diff = moment(time.startDate).diff(new Date(), "minute");
      // time["diff"] = diff;
      const report = q.reportQE.find((qe) => qe.at === time.at);
      time["report"] = report ? true : false;
      // return true;
      if (diffDay <= minOfDay) return true;
      return false;
    });

    // console.log(now);
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

  res.json(newQueue);
});

router.get("/chamberRemain", async (req, res, next) => {
  const { startDate, endDate } = req.query;
  // console.log("startDate", startDate);

  const queues = await queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
  ]);

  // res.json(queues);

  let chambers = await chamber_list.aggregate([
    {
      $match: {},
    },
    // {
    //   $lookup: {
    //     from: "queues",
    //     localField: "code",
    //     foreignField: "chamber.code",
    //     as: "queue",
    //   },
    // },
  ]);
  // console.log("🚀 ~ chambers:", chambers);
  chambers = chambers.map((c) => {
    const findItem = queues.filter((q) => q?.chamber?.code == c.code);
    // console.log("🚀 ~ findItem:", findItem);
    return {
      ...c,
      queue: findItem.length != 0 ? findItem : [],
    };
  });
  // res.json(chambers);

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

  res.json(mapChamber);
});

router.get("/operateRemain", async (req, res, next) => {
  const { startDate, endDate } = req.query;
  // console.log("startDate", startDate);

  const operateItem = await operate_item.aggregate([
    {
      $match: {
        status: "ready",
      },
    },
  ]);

  const queues = await queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
  ]);

  const newOperate = operateItem.map((o) => {
    return {
      ...o,
      queue: loopQueue(queues, o.type, o),
    };
  });

  res.json(newOperate);
});
function loopQueue(queues, operateType, o) {
  const queueFilter = queues.filter(
    (q) => q.operate.status && q.operate[operateType].code === o.code
  );
  // console.log(queueFilter);
  const newQueue = queueFilter.map((q) => {
    return {
      controlNo: q.work.controlNo,
      chamber: `${q.chamber?.code}( ${q.chamber?.name} )`,
      qty: q.operate[operateType].qty,
      endDate: q.endDate,
    };
  });
  return newQueue;
}

router.get("/reportStatus", async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const newStartDate = moment(startDate).startOf("day").toLocaleString();
  // console.log("🚀 ~ newStartDate:", newStartDate);
  const newEndDate = moment(endDate).endOf("day").toLocaleString();
  // console.log("🚀 ~ newEndDate:", newEndDate);
  try {
    const queues = await queue.aggregate([
      {
        $match: {
          reportQE: {
            $elemMatch: {
              endDate: {
                $gte: new Date(newStartDate),
                $lte: new Date(newEndDate),
              },
            },
          },
        },
      },
      // {
      //   $match: {
      //     "reportQE.endDate": {
      //       $gte: new Date(startDate),
      //     },
      //     "reportQE.startDate": {
      //       $lte: new Date(startDate),
      //     },
      //   },
      // },
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

    // res.json({ data: queues });
    const users = await userModel.aggregate([{ $match: {} }]);

    const newQueue = queues.map((q) => {
      const user = users.find((u) => u._id == q.userId);
      // console.log(
      //   moment(q.reportQE[0]?.endDate).isBetween(
      //     moment(newStartDate),
      //     moment(newEndDate)
      //   )
      // );
      const nowQueue = q.reportQE.find(
        (r) =>
          r?.endDate &&
          moment(r?.endDate).isBetween(moment(newStartDate), moment(newEndDate))
      );
      // console.log("nowQueue", nowQueue);
      return {
        ...q,
        userName: user ? user.name : null,
        userSection: user ? user.section : null,
        nowAt: nowQueue?.at,
      };
    });
    // console.log("🚀 ~ users:", newQueue);
    const uni = [
      ...new Map(newQueue.map((item) => [item["controlNo"], item])).values(),
    ];
    // console.log(uni);
    res.json(uni);
  } catch (error) {
    res.sendStatus(500);
  }
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  request_form
    .updateMany({ _id: id }, { $set: req.body })
    .exec((err, result) => {
      if (err) {
        res.json(err);
      } else {
        res.json(result);
      }
    });
});

router.delete("/delete/", async (req, res, next) => {
  const { id } = req.query;
  let arr = [];
  arr.push(await request_form.deleteMany({ _id: ObjectId(id) }));
  arr.push(await formStep1Detail.deleteMany({ requestId: id }));
  arr.push(await formStep2TestPurpose.deleteMany({ requestId: id }));
  arr.push(await formStep3TestingType.deleteMany({ requestId: id }));
  arr.push(await formStep4TestingCondition.deleteMany({ requestId: id }));
  arr.push(await formStep5UserApprove.deleteMany({ requestId: id }));
  arr.push(await queue.deleteMany({ "work.requestId": id }));
  arr.push(await logFlow.deleteMany({ formId: id }));
  Promise.all(arr)
    .then((result) => {
      res.json(result);
    })
    .catch((err) => res.json(err));
});

router.delete("/all/", async (req, res, next) => {
  try {
    await formStep1Detail.deleteMany({});
    await formStep2TestPurpose.deleteMany({});
    await formStep3TestingType.deleteMany({});
    await formStep4TestingCondition.deleteMany({});
    await formStep5UserApprove.deleteMany({});
    await request_form.deleteMany({});
    await queue.deleteMany({});
    await logFlow.deleteMany({});
    res.send("ok");
  } catch (error) {
    console.log(error);
    res.sendStatus(500).json(error);
  }
});

router.delete("/deleteAll/", async (req, res, next) => {
  const request = await request_form.aggregate([
    { $match: {} },
    {
      $project: {
        id: {
          $toString: "$_id",
        },
      },
    },
  ]);
  let arr = [];
  if (request.length > 0) {
    for (let index = 0; index < request.length; index++) {
      arr.push(await request_form.deleteMany({ _id: request[index].id }));
      arr.push(
        await formStep1Detail.deleteMany({ requestId: request[index].id })
      );
      arr.push(
        await formStep2TestPurpose.deleteMany({ requestId: request[index].id })
      );
      arr.push(
        await formStep3TestingType.deleteMany({ requestId: request[index].id })
      );
      arr.push(
        await formStep4TestingCondition.deleteMany({
          requestId: request[index].id,
        })
      );
      arr.push(
        await formStep5UserApprove.deleteMany({ requestId: request[index].id })
      );
      arr.push(await queue.deleteMany({ "work.requestId": request[index].id }));
      if (index + 1 == request.length) {
        Promise.all(arr)
          .then((result) => {
            res.sendStatus(200);
          })
          .catch((err) => res.json(err));
      }
    }
  } else {
    res.sendStatus(400);
  }
});

router.post("/count", (req, res, next) => {
  const condition = [
    {
      $match: {
        createdAt: {
          $gte: new Date(req.body.date),
        },
        corporate: {
          $eq: req.body.corporate,
        },
      },
    },
    {
      $count: "document",
    },
  ];
  request_form.aggregate(condition).exec((err, result) => {
    res.json(result);
  });
});

router.get("/getByControlNo", async (req, res, next) => {
  try {
    const { controlNo } = req.query;
    let con1 = {
      $match: {},
    };
    if (controlNo) {
      con1 = {
        $match: {
          controlNo: controlNo,
        },
      };
    }
    const result = await request_form.aggregate([con1, { $count: "sum" }]);
    res.json(result);
  } catch (error) {
    res.sendStatus(500);
  }
});

async function checkDuplicateRequestNo(controlNo) {
  return await request_form
    .aggregate([
      {
        $match: {
          controlNo: controlNo,
        },
      },
    ])
    .limit(1);
}

// todo backup request
router.post("/backup_request", async (req, res, next) => {
  try {
    const payload = req.body;
    const result = await backup_request.insertMany(payload);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
module.exports = router;
