let express = require("express");
let router = express.Router();

const REQUEST_REVISES = require("../models/request_revises");
const request_form = require("../models/request_form");
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

router.get("/revisesTable", async (req, res, next) => {
  const { userId } = req.query;
  console.log("🚀 ~ userId:", userId);

  const requestOngoing = await request_form.aggregate([
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
        "step5.prevUser._id": userId,
      },
    },
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

module.exports = router;
