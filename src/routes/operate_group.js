let express = require("express");
let router = express.Router();

const operate_group = require("../models/operate-group");

// router.get("", (req, res, next) => {
//     const con = [
//         { $match: {} },
//         {
//             $project: {
//                 code: "$code",
//                 name: "$name",
//                 attachment: "$operate.attachment",
//                 power: "$operate.power",
//                 checker: "$operate.checker",
//                 status: "$status",
//             },
//         },
//         {
//             $lookup: {
//                 from: "operate_items",
//                 localField: "power.code",
//                 foreignField: "code",
//                 as: "power2",
//             },
//         },
//         {
//             $lookup: {
//                 from: "operate_items",
//                 localField: "checker.code",
//                 foreignField: "code",
//                 as: "checker2",
//             },
//         },
//         {
//             $lookup: {
//                 from: "operate_items",
//                 localField: "attachment.code",
//                 foreignField: "code",
//                 as: "attachment2",
//             },
//         },
//     ];
//     operate_group.aggregate(con).exec(async(err, result) => {
//         if (err) {
//             res.json(err);
//         } else {
//             // res.json(result);
//             res.json(await good(result));
//         }
//     });
//     //   operate_group.find({}).exec((err, result) => {
//     //     if (err) {
//     //       res.json(err);
//     //     } else {
//     //       res.json(result);
//     //     }
//     //   });
// });

// function good(result) {
//     return new Promise((resolve) => {
//         console.log(result.checker);
//         let operateArr = [];
//         const temp = result.map(re => {
//             for (let index = 0; index < re.checker.length; index++) {
//                 const e_checker = re.checker[index];
//                 const e_checker2 = re.checker2[index] || re.checker2[index - 1];
//                 const e_attachment = re.attachment[index];
//                 const e_attachment2 = re.attachment2[index] || re.attachment2[index - 1];
//                 const e_power = re.power[index];
//                 const e_power2 = re.power2[index] || re.power2[index - 1];
//                 operateArr.push({
//                     attachment: {
//                         ...e_attachment,
//                         name: e_attachment2.name,
//                     },
//                     power: {
//                         ...e_power,
//                         name: e_power2,
//                     },
//                     checker: {
//                         ...e_checker,
//                         name: e_checker2,
//                     },
//                 });
//                 if (index + 1 == re.checker.length) {
//                     return {
//                         code: re.code,
//                         name: re.name,
//                         status: re.status,
//                         _id: re._id,
//                         operate: operateArr,
//                     };
//                 }
//             }
//         });
//         resolve(temp)
//     });
// }

// function mapOperateGroup(result) {
//     return new Promise((resolve) => {
//         const resData = result.map((re) => {
//             const a = foo(re);
//             console.log(a);
//         });
//         resolve(resData);
//     });
// }

// function foo(re) {
//     let operateArr = [];
//     for (let index = 0; index < re.attachment.length; index++) {
//         const newAttachment = re.attachment.map((att) => {
//             const temp = re.attachment2.find((att2) => att2.code == att.code);
//             return {
//                 ...att,
//                 name: temp.name,
//             };
//         });
//         const newPower = re.power.map((att) => {
//             const temp = re.power2.find((att2) => att2.code == att.code);
//             return {
//                 ...att,
//                 name: temp.name,
//             };
//         });
//         const newChecker = re.checker.map((att) => {
//             const temp = re.checker2.find((att2) => att2.code == att.code);
//             return {
//                 ...att,
//                 name: temp.name,
//             };
//         });

//         re.attachment = newAttachment;
//         re.power = newPower;
//         re.checker = newChecker;

//         operateArr.push({
//             attachment: re.attachment,
//             power: re.power,
//             checker: re.checker,
//         });

//         // arr.push({
//         //   code: re.code,
//         //   name: re.name,
//         //   status: re.status,
//         //   _id: re._id,
//         //   operate: {
//         //     attachment: re.attachment,
//         //     power: re.power,
//         //     checker: re.checker,
//         //   },
//         // });
//         if (index + 1 == re.attachment.length) {
//             return {
//                 code: re.code,
//                 name: re.name,
//                 status: re.status,
//                 _id: re._id,
//                 operate: operateArr,
//             };
//         }
//         // return {
//         //     code: re.code,
//         //     name: re.name,
//         //     status: re.status,
//         //     _id: re._id,
//         //     operate: {
//         //         attachment: re.attachment,
//         //         power: re.power,
//         //         checker: re.checker,
//         //     },
//         // };
//     }
// }

router.get("", (req, res, next) => {
    operate_group.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.get("/lastCode", (req, res, next) => {
    operate_group
        .aggregate([{
            $match: {},
        }, ])
        .sort({ code: -1 })
        .limit(1)
        .exec((err, result) => {
            if (err) res.json(err);
            res.json(result);
        });
});

router.post("/insert", async(req, res, next) => {
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