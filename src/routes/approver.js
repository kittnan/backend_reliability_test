let express = require("express");
let router = express.Router();

const approver = require("../models/approver");

router.get("", (req, res, next) => {
  approver.find().exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});
router.get("/id", (req, res, next) => {
  const { id } = req.query;
  // console.log(id);
  approver.findById(id).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.post("/insert", async (req, res, next) => {
  approver.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  approver.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  approver.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
