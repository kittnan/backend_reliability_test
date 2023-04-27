let express = require("express");
let router = express.Router();

const step3 = require("../models/form-step3-testingType");
const type_master = require("../models/testing_type_master");

router.get("", (req, res, next) => {
  const { requestId } = req.query;
  step3
    .aggregate([
      {
        $match: {
          requestId: requestId,
        },
      },
    ])
    .exec((err, result) => {
      // console.log(err, result);
      if (err) {
        res.json(err);
      } else {
        res.json(result);
      }
    });
});

router.get("/migrate", async (req, res, next) => {
  const result = await type_master.find({}).exec();
  const all = await step3.find({}).exec();
  // update all data
  const newResult = all.map((item) => {
    item.data = item.data.map((i) => {
      const bar = result.find((j) =>
        j.group.toLowerCase().includes(i.groupName.toLowerCase())
      );
      return { ...i, type: bar.type };
    });
    return item;
  });

  for (let i = 0; i < newResult.length; i++) {
    step3
      .updateMany({ _id: newResult[i]._id }, { $set: newResult[i] })
      .exec((err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log(result);
        }
      });
    // finish loop
    if (i === newResult.length - 1) {
      res.send("done");
    }
  }
});

router.post("/insert", async (req, res, next) => {
  step3.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  step3.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  step3.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
