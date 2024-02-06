let express = require("express");
let router = express.Router();

const TRACKING_OPERATE = require("../models/tracking-operate");

router.get("", async (req, res, next) => {
  try {
    let { runNo, code, status } = req.query;
    let con = [
      {
        $match: {},
      },
    ];
    if (runNo) {
      runNo = JSON.parse(runNo);
      console.log("🚀 ~ runNo:", runNo)
      con.push({
        $match: {
          runNo: {
            $in: runNo,
          },
        },
      });
    }
    if (code) {
      code = JSON.parse(code);
      con.push({
        $match: {
          code: {
            $in: code,
          },
        },
      });
    }
    if (status) {
      status = JSON.parse(status);
      con.push({
        $match: {
          status: {
            $in: status,
          },
        },
      });
    }
    const data = await TRACKING_OPERATE.aggregate(con);
    res.json(data);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.post("/insert", async (req, res, next) => {
  try {
    const prevData = await TRACKING_OPERATE.aggregate([
      {
        $match: {}
      }
    ])
    let payload = req.body
    const form = payload.map(item => {
      if (prevData.some(prev => prev.code == item.code)) {
        return {
          updateOne: {
            filter: { code: item.code },
            update: { $set: item }
          }
        }
      } else {
        return { insertOne: item }
      }
    })
    const data = await TRACKING_OPERATE.bulkWrite(form);
    res.json(data);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  TRACKING_OPERATE.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  TRACKING_OPERATE.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
