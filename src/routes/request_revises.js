let express = require("express");
let router = express.Router();
const REQUEST_REVISES = require("../models/request_revises");
const REQUEST_FORM = require("../models/request_form");
const STEP1 = require("../models/form-step1-detail");
const STEP2 = require("../models/form-step2-testPurpose");
const STEP3 = require("../models/form-step3-testingType");
const STEP4 = require("../models/form-step4-testingCondition");
const QUEUES = require("../models/queue");

const ObjectId = require("mongodb").ObjectID;

router.get("/", async (req, res, next) => {
  const { id } = req.query;
  let con1 = {
    $match: {},
  };

  try {
    if (id) {
      con1 = {
        $match: {
          _id: ObjectId(id),
        },
      };
    }
    const resultFind = await REQUEST_REVISES.aggregate([con1]);
    res.json(resultFind);
  } catch (error) {
    console.log(error);
    const errorStr = JSON.stringify(error);
    res.sendStatus(500).json(errorStr);
  }
});
router.get("/ByRequestId", async (req, res, next) => {
  const { id } = req.query;
  let con1 = {
    $match: {},
  };

  try {
    if (id) {
      con1 = {
        $match: {
          requestId: id,
        },
      };
    }
    const resultFind = await REQUEST_REVISES.aggregate([con1]);
    res.json(resultFind);
  } catch (error) {
    console.log(error);
    const errorStr = JSON.stringify(error);
    res.sendStatus(500).json(errorStr);
  }
});

router.get("/revisesTable", async (req, res, next) => {
  const { userId, level } = req.query;
  const newLevel = level ? JSON.parse(level) : [];

  let conLevel = {
    $match: {},
  };

  if (newLevel && newLevel.length != 0) {
    conLevel = {
      $match: {
        $or: [
          {
            "request_revises.level": {
              $in: newLevel,
            },
          },
          {
            level: {
              $in: newLevel,
            },
          },
        ],
      },
    };
  }

  const requestOngoing = await REQUEST_FORM.aggregate([
    {
      $match: {
        status: "qe_window_person_report",
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
        from: "request_revises",
        localField: "_id",
        foreignField: "requestId",
        as: "request_revises",
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
      $match: {
        $or: [
          {
            "step5.prevUser._id": userId,
          },
          {
            "request_revises.nextApprove._id": userId,
          },
          {
            "request_revises.historyApprove._id": userId,
          },
        ],
      },
    },
    conLevel,
    {
      $project: {
        requestId: "$_id",
        controlNo: { $arrayElemAt: ["$step1.controlNo", 0] },
        section: { $arrayElemAt: ["$step1.department", 0] },
        lotNo: { $arrayElemAt: ["$step1.lotNo", 0] },
        modelNo: { $arrayElemAt: ["$step1.modelNo", 0] },
        requestSubject: { $arrayElemAt: ["$step1.requestSubject", 0] },
        step1: { $arrayElemAt: ["$step1", 0] },
        step2: { $arrayElemAt: ["$step2", 0] },
        step3: { $arrayElemAt: ["$step3", 0] },
        step4: { $arrayElemAt: ["$step4", 0] },
        step5: "$step5",
        status: "$status",
        qeReceive: "$qeReceive",
        nextApprove: "$nextApprove",
        createdAt: "$createdAt",
        updatedAt: "$updatedAt",
        queues: "$queues",
        followUp: "$followUp",
        purpose: { $arrayElemAt: ["$step2", 0] },
        request_revise: { $arrayElemAt: ["$request_revises", 0] },
        level: "$level",
      },
    },
  ]);
  res.json(requestOngoing);
});

router.post("/insert", async (req, res, next) => {
  REQUEST_REVISES.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  REQUEST_REVISES.updateMany({ _id: id }, { $set: req.body }).exec(
    (err, result) => {
      if (err) {
        res.json(err);
      } else {
        res.json(result);
      }
    }
  );
});

router.put("/updateByRequestId/:id", (req, res, next) => {
  const { id } = req.params;
  REQUEST_REVISES.updateMany({ requestId: id }, { $set: req.body }).exec(
    (err, result) => {
      if (err) {
        res.json(err);
      } else {
        res.json(result);
      }
    }
  );
});
router.post("/mergeOverrideForm", async (req, res, next) => {
  try {
    const payload = req.body.data;
    const controlNo = req.body.controlNo;
    const requestId = req.body.requestId;

    let con1 = { $match: {} };
    let con2 = { $match: {} };
    if (controlNo) {
      con1 = {
        $match: {
          controlNo: controlNo,
        },
      };
    }

    // const queryForm = await REQUEST_FORM.aggregate([con1]);
    con2 = {
      $match: {
        requestId: requestId,
      },
    };
    let con3 = {
      $match: {
        "work.requestId": requestId,
      },
    };
    const queryStep1 = await STEP1.aggregate([con1]);
    const queryStep2 = await STEP2.aggregate([con2]);
    const queryStep3 = await STEP3.aggregate([con2]);
    const queryStep4 = await STEP4.aggregate([con2]);
    // const queryQueues = await QUEUES.aggregate([con3]);

    const mergeStep1 = {
      ...queryStep1[0],
      ...payload.step1,
    };
    const mergeStep2 = {
      ...queryStep2[0],
      ...payload.step2,
    };
    const mergeStep3 = {
      ...queryStep3[0],
      ...payload.step3,
    };
    const mergeStep4 = {
      ...queryStep4[0],
      ...payload.step4,
    };

    const requestFormItem = await REQUEST_FORM.find({
      controlNo: controlNo,
    }).lean();
    const step1Item = await STEP1.find({ controlNo: controlNo }).lean();
    const step2Item = await STEP2.find({ requestId: requestId }).lean();
    const step3Item = await STEP3.find({ requestId: requestId }).lean();
    const step4Item = await STEP4.find({ requestId: requestId }).lean();
    const requestReviseFormItem = await REQUEST_REVISES.find({
      requestId: requestId,
    }).lean();

    const resUpdateRequestForm = await REQUEST_FORM.updateOne(
      { _id: requestFormItem[0]._id },
      {
        $set: {
          userId: payload.userId,
          date: payload.date,
          controlNo: payload.controlNo,
          corporate: payload.corporate,
          qeReceive: payload.qeReceive,
          table: payload.table,
        },
      }
    );
    const resUpdateStep1 = await STEP1.updateOne(
      { _id: step1Item[0]._id },
      { $set: mergeStep1 }
    );
    const resUpdateStep2 = await STEP2.updateOne(
      { _id: step2Item[0]._id },
      { $set: mergeStep2 }
    );
    const resUpdateStep3 = await STEP3.updateOne(
      { _id: step3Item[0]._id },
      { $set: mergeStep3 }
    );
    const resUpdateStep4 = await STEP4.updateOne(
      { _id: step4Item[0]._id },
      { $set: mergeStep4 }
    );

    const resDeleteQueue = await QUEUES.deleteMany({
      "work.controlNo": controlNo,
    });

    const new_queues = payload.queues.map((a) => {
      delete a._id;
      return {
        ...a,
      };
    });

    const resInsertQueues = await QUEUES.insertMany(new_queues);

    const resUpdateRequestReviseForm = await REQUEST_REVISES.updateOne(
      { _id: requestReviseFormItem[0]._id },
      {
        $set: {
          ...payload,
          level: 20,
          status: "finish",
          nextApprove: null,
        },
      }
    );
    res.json([
      resUpdateRequestForm,
      resUpdateStep1,
      resUpdateStep2,
      resUpdateStep3,
      resUpdateStep4,
      resDeleteQueue,
      resInsertQueues,
      resUpdateRequestReviseForm,
    ]);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  REQUEST_REVISES.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});
router.delete("/deleteByRequestId/:id", (req, res, next) => {
  const { id } = req.params;
  REQUEST_REVISES.deleteOne({ requestId: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
