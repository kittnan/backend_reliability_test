let express = require("express");
let router = express.Router();

const testing_type_master = require("../models/testing_type_master");

router.get("", (req, res, next) => {
  testing_type_master.find({}).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.post("/insert", async (req, res, next) => {
  testing_type_master.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  testing_type_master
    .updateMany({ _id: id }, { $set: req.body })
    .exec((err, result) => {
      if (err) {
        res.json(err);
      } else {
        res.json(result);
      }
    });
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  testing_type_master.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
