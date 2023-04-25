let express = require("express");
let router = express.Router();

const step4 = require("../models/form-step4-testingCondition");
const step3 = require("../models/form-step3-testingType");

router.get("/migrate", async (req, res, next) => {
  const temp = await step4.aggregate([
    {
      $match: {
        "data.value": 0,
      },
    },
  ]);
  // console.log(temp);
  // for loop step4
  let arr = [];
  for (let i = 0; i < temp.length; i++) {
    // find step3
    const temp2 = await step3.aggregate([
      {
        $match: {
          requestId: temp[i].requestId,
        },
      },
    ]);
    const temp3 = temp2[0].data.filter(
      (d) => d.checked == true && d.groupName == "Optical"
    );
    const newObj = {
      _id: temp[i]._id,
      requestId: temp[i].requestId,
      data: [
        {
          name: "Optical",
          value: 0,
          reportStatus: temp[i].data[0].data.reportStatus,
          data: {
            qty: temp[i].data[0].data.qty,
            reportStatus: temp[i].data[0].data.reportStatus,
            inspection: [0],
            report: [0],
            detailTest: temp[i].data[0].data.detailTest,
            operate: {
              text: "no-operate",
              value: false,
            },
            inspectionDetail: {
              name: "normal",
              detail: "",
            },
          },
          dataTable: {
            name: "Optical",
            operate: {
              text: "no-operate",
              value: false,
            },
            inspectionDetail: {
              name: "normal",
              detail: "",
            },
            inspection: [0],
            report: [0],
            inspectionDetail: {
              name: "normal",
              detail: "",
            },
            sample: "",
            qty: temp[i].data[0].data.qty,
          },
          inspectionDetail: {
            name: "normal",
            detail: "",
          },
        },
      ],
    };

    // update newObj to step4 with _id
    const a = await step4.updateMany({ _id: newObj._id }, { $set: newObj });

    arr.push(a);
    // merge step3 and step4
    // const merged = {
    //   ...temp[i],
    //   ...temp2[0],
    // };
    // console.log(merged);

    if (i + 1 === temp.length) {
      res.json(arr);
    }
  }
});

router.get("", (req, res, next) => {
  const { requestId } = req.query;
  step4
    .aggregate([
      {
        $match: {
          requestId: requestId,
        },
      },
    ])
    .exec((err, result) => {
      //   console.log(err, result);
      if (err) {
        res.json(err);
      } else {
        res.json(result);
      }
    });
});

router.post("/insert", async (req, res, next) => {
  step4.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  step4.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  step4.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/deleteByFormId/:id", (req, res, next) => {
  const { id } = req.params;
  step4.deleteOne({ requestId: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
