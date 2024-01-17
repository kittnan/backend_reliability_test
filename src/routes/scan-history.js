let express = require("express");
let router = express.Router();

const SCAN_HISTORY = require("../models/scan-history");

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
    const data = await SCAN_HISTORY.aggregate(con);
    res.json(data);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.post("/insert", async (req, res, next) => {
  try {
    const data = await SCAN_HISTORY.insertMany(req.body);
    res.json(data);
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  SCAN_HISTORY.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  SCAN_HISTORY.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
