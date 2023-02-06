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
const chamber_list = require("../models/chamber_list");
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
        step5: "$step5",
        status: "$status",
        table: "$table",
        nextApprove: "$nextApprove",
        queues: "$queues",
        level: "$level",
        comment: "$comment",
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
      console.log(err, result);
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
      if (err) {
        console.log(err);
        res.status(500).json(err);
      } else {
        res.status(200).json(result);
      }
    });
});
router.get("/tableShow", async (req, res, next) => {
  const { userId, status } = req.query;
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
      if (err) {
        console.log(err);
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
    console.log(req.params);
    const newStatus = JSON.parse(status);
    console.log(newStatus);

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
  console.log(match);
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
  const resultDuplicate = await checkDuplicateRequestNo(payload.controlNo);
  let newControlNo = "";
  if (resultDuplicate.length === 0) {
    newControlNo = payload.controlNo;
  } else {
    const splitStr = payload.controlNo.split("-");
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
    const oldControlNoStr = oldControlNoNum.toString();
    let temp = "";
    if (oldControlNoStr.length == 1) temp = "00" + oldControlNoStr;
    if (oldControlNoStr.length == 2) temp = "0" + oldControlNoStr;
    newControlNo = `${splitStr[0]}-${splitStr[1]}-${splitStr[2]}-${temp}-${splitStr[4]}`;
    payload.controlNo = newControlNo;
  }
  const createRequestFormResult = await request_form.insertMany(payload);
  res.json(createRequestFormResult);
});

// !new

// TODO remain
router.get("/corporateRemain", async (req, res, next) => {
  const { startDate } = req.query;
  console.log("startDate", startDate);

  const foo = new Date(startDate);
  console.log("corporateRemain", foo);
  const queues = await queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
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
  const { startDate } = req.query;
  const queues = await queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
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
  const sections = await loopFindUser(requestData);
  const countSections = sections.reduce((prev, now) => {
    const foo = prev.find((p) => p.name === now.section);
    if (foo) {
      const index = prev.indexOf(foo);
      foo.value++;
      prev[index] = foo;
      return prev;
    } else {
      prev.push({
        name: now.section,
        value: 1,
      });
      return prev;
    }
  }, []);
  res.json(countSections);
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
    arr.push(user[0]);
    if (i + 1 === requestData.length) return arr;
  }
}

router.get("/dailyRemain", async (req, res, next) => {
  const startDate = moment().startOf("day").toLocaleString();
  const endDate = moment().endOf("day").toLocaleString();
  const queues = await queue.aggregate([
    {
      $match: {
        inspectionTime: {
          $elemMatch: {
            endDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
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

  const newQueue = queues.map((q) => {
    const now = q.inspectionTime.filter((time) => {
      const diff = moment(time.endDate).diff(new Date(), "minute");
      time["diff"] = diff;
      const report = q.reportQE.find((qe) => qe.at === time.at);
      time["report"] = report ? true : false;
      if (diff <= 24) return true;
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
    };
  });

  res.json(newQueue);
});

router.get("/chamberRemain", async (req, res, next) => {
  const { startDate } = req.query;
  console.log("startDate", startDate);

  const chambers = await chamber_list.aggregate([
    {
      $match: {},
    },
    {
      $lookup: {
        from: "queues",
        localField: "code",
        foreignField: "chamber.code",
        as: "queue",
      },
    },
  ]);

  const mapChamber = chambers.map((c) => {
    const use = c.queue.reduce((prev, now) => {
      return (prev += now.work.qty);
    }, 0);
    return {
      ...c,
      capacity: Number(c.capacity),
      use: use,
    };
  });

  res.json(mapChamber);
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
  Promise.all(arr)
    .then((result) => {
      res.sendStatus(200);
    })
    .catch((err) => res.json(err));
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

module.exports = router;
