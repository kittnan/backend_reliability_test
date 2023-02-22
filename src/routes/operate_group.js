let express = require("express");
let router = express.Router();
let fn = require("./queue_fn");
const queue = require("../models/queue");
const operate_items = require("../models/operate-items");

const operate_group = require("../models/operate-group");

router.get("/", (req, res, next) => {
  operate_group.aggregate([{ $match: {} }]).exec((err, result) => {
    if (err) res.json(err);
    res.json(result);
  });
});
router.get("/ready2", async (req, res, next) => {
  const { startDate } = req.query;
  const groups = await operate_group.aggregate([{ $match: {} }]);

  const temp = groups.filter((g) => {
    return foo1(g);
  });
  res.json(temp);
});

function foo1(group) {
  // console.log(group);
  const temp = group.operate.map((o) => {
    return foo2(group.operate);
  });
  return temp;
}

function foo2(operate) {
  // console.log(operate);
  return operate;
}

router.get("/ready/:startDate/:operate", async (req, res, next) => {
  const { startDate, operate } = req.params;
  const operateJson = JSON.parse(operate);
  const run_checker = await checkerRunning(startDate, operateJson.checker.code);
  const run_power = await powerRunning(startDate, operateJson.power.code);
  const run_attachment = await attachmentRunning(
    startDate,
    operateJson.attachment.code
  );

  const stock_checker = await operate_items.aggregate([
    {
      $match: {
        code: operateJson.checker.code,
      },
    },
  ]);
  const r_checker = checkStock(
    run_checker,
    operateJson,
    "checker",
    stock_checker[0].stock
  );

  const stock_power = await operate_items.aggregate([
    {
      $match: {
        code: operateJson.power.code,
      },
    },
  ]);
  const r_power = checkStock(
    run_power,
    operateJson,
    "power",
    stock_power[0].stock
  );

  const stock_attachment = await operate_items.aggregate([
    {
      $match: {
        code: operateJson.attachment.code,
      },
    },
  ]);
  const r_attachment = checkStock(
    run_attachment,
    operateJson,
    "attachment",
    stock_attachment[0].stock
  );
  let text = "";
  r_checker.status ? (text += "") : (text += r_checker.statusText);
  r_power.status ? (text += "") : (text += r_power.statusText);
  r_attachment.status ? (text += "") : (text += r_attachment.statusText);

  if (r_checker.status && r_power.status && r_attachment.status) {
    res.json({
      checker: r_checker,
      power: r_power,
      attachment: r_attachment,
      status: true,
      text: `
            <p>checker in stock is ${r_checker.statusText}/${stock_checker[0].stock}</p>
            <p>power in stock is ${r_power.statusText}/${stock_power[0].stock}</p>
            <p>attachment in stock is ${r_attachment.statusText}/${stock_attachment[0].stock}</p>
            `,
    });
  } else {
    res.json({
      checker: r_checker,
      power: r_power,
      attachment: r_attachment,
      status: false,
      text: `
            <p>checker in stock is ${r_checker.statusText}/${stock_checker[0].stock}</p>
            <p>power in stock is ${r_power.statusText}/${stock_power[0].stock}</p>
            <p>attachment in stock is ${r_attachment.statusText}/${stock_attachment[0].stock}</p>
            `,
    });
  }
});

function checkStock(run, operate, key, stock) {
  if (run.length > 0) {
    if (Number(run[0].total) + Number(operate[key].qty) <= Number(stock)) {
      return {
        ...operate[key],
        status: true,
        statusText: Number(run[0].total) + Number(operate[key].qty),
      };
    } else {
      return {
        ...operate[key],
        status: false,
        statusText: Number(run[0].total) + Number(operate[key].qty),
        statusText: Number(run[0].total) + Number(operate[key].qty),
      };
    }
  } else {
    if (Number(operate[key].qty) <= Number(stock)) {
      return {
        ...operate[key],
        status: true,
        statusText: Number(operate[key].qty),
      };
    } else {
      return {
        ...operate[key],
        status: false,
        statusText: Number(operate[key].qty),
      };
    }
  }

  // if (
  //     run.length > 0 &&
  //     Number(run[0].total) + Number(operate[key].qty) <= Number(stock)
  // ) {
  //     return {
  //         ...operate[key],
  //         status: true,
  //     };
  // } else {
  //     return {
  //         ...operate[key],
  //         status: false,
  //     };
  // }
}

function onRunning(startDate) {
  return queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
        },
      },
    },
  ]);
}

function findStock(code) {
  return operate_items.aggregate([
    {
      $match: {
        code: code,
      },
    },
  ]);
}

function checkerRunning(startDate, code) {
  return queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
        },
        "operate.checker.code": code,
      },
    },
    {
      $group: {
        _id: "$operate.checker.code",
        total: {
          $sum: "$operate.checker.qty",
        },
      },
    },
  ]);
}

function powerRunning(startDate, code) {
  return queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
        },
        "operate.power.code": code,
      },
    },
    {
      $group: {
        _id: "$operate.power.code",
        total: {
          $sum: "$operate.power.qty",
        },
      },
    },
  ]);
}

function attachmentRunning(startDate, code) {
  return queue.aggregate([
    {
      $match: {
        endDate: {
          $gte: new Date(startDate),
        },
        "operate.attachment.code": code,
      },
    },
    {
      $group: {
        _id: "$operate.attachment.code",
        total: {
          $sum: "$operate.attachment.qty",
        },
      },
    },
  ]);
}

router.get("/lastCode", (req, res, next) => {
  operate_group
    .aggregate([
      {
        $match: {},
      },
    ])
    .sort({ code: -1 })
    .limit(1)
    .exec((err, result) => {
      if (err) res.json(err);
      res.json(result);
    });
});

router.post("/insert", async (req, res, next) => {
  operate_group.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  operate_group
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
  operate_group.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
