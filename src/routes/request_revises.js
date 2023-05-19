let express = require("express");
let router = express.Router();

const REQUEST_REVISES = require("../models/request_revises");
const REQUEST = require("../models/request_form");
const ObjectId = require("mongodb").ObjectID;

router.get("/prev", async (req, res, next) => {
  const { _id } = req.query;
  if (_id) {
    try {
      const result = await REQUEST.aggregate([
        {
          $match: {
            _id: ObjectId(_id),
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
            step1: { $arrayElemAt: ["$step1", 0] },
          },
        },
      ]);
      console.log("🚀 ~ result:", result);
      if (result && result.length > 0) {
        res.json(result);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      res.json(error).sendStatus(500);
    }
  } else {
    res.statusCode(500);
  }
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
