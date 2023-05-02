let express = require("express");
let router = express.Router();

const step1 = require("../models/form-step1-detail");
const form = require("../models/request_form");
const step5 = require("../models/form-step5-userApprove");
const ObjectId = require("mongodb").ObjectID;

router.get("", (req, res, next) => {
  // console.log(req.params);
  step1.find({}).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

// router.get("/foo", async (req, res, next) => {
//   const con1 = {
//     $match: {
//       department: "DST",
//     },
//   };
//   const l1 = {
//     $lookup: {
//       from: "formstep5userapproves",
//       localField: "requestId",
//       foreignField: "requestId",
//       as: "step5",
//     },
//   };

//   const p1 = {
//     $project: {
//       controlNo: "$controlNo",
//       department: { $arrayElemAt: ["$step5.prevUser", 0] },
//     },
//   };

//   const p2 = {
//     $project: {
//       department: { $toObjectId: "$department._id" },
//     },
//   };

//   const foo = await step1.aggregate([con1, l1, p1]);

//   res.json(foo);
// });

router.post("/insert", async (req, res, next) => {
  step1.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  step1.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  step1.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
