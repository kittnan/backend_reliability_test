let express = require("express");
let router = express.Router();

const request_form = require("../models/request_form");
const formStep1Detail = require("../models/form-step1-detail");
const formStep2TestPurpose = require("../models/form-step2-testPurpose");
const formStep3TestingType = require("../models/form-step3-testingType");
const formStep4TestingCondition = require("../models/form-step4-testingCondition");
const formStep5UserApprove = require("../models/form-step5-userApprove");

router.get("", (req, res, next) => {
    request_form.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});
router.get("/id/:id", (req, res, next) => {
    const { id } = req.params;
    request_form.findById(id).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/getByCondition/", (req, res, next) => {
    const payload = req.body;
    let match = {
        $match: {},
    };
    if (payload && payload.action && payload.status) {
        if (payload.action == "nin") {
            const temp = {
                status: {
                    $nin: payload.status,
                },
            };
            match["$match"] = {
                ...temp,
                ...match["$match"],
            };
        }
        if (payload.action == "in") {
            const temp = {
                status: {
                    $in: payload.status,
                },
            };
            match["$match"] = {
                ...temp,
                ...match["$match"],
            };
        }
        if (payload.action == "all") {
            match["$match"] = {};
        }
    }
    // if (payload && payload.status && payload.status.length > 0) {
    //     const temp = {
    //         status: {
    //             '$nin': payload.status,
    //         },
    //     };
    //     match["$match"] = {
    //         ...temp,
    //         ...match["$match"]
    //     };
    // }
    if (payload && payload._id) {
        const temp = {
            "step4.name._id": payload._id,
        };
        match["$match"] = {
            ...temp,
            ...match["$match"],
        };
    }
    console.log(match);
    request_form.aggregate([{...match }]).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/insert", async(req, res, next) => {
    let payload = req.body;
    const resultDuplicate = await checkDuplicateRequestNo(
        payload.detail.controlNo
    );
    let newControlNo = "";
    if (resultDuplicate.length === 0) {
        newControlNo = payload.detail.controlNo;
    } else {
        const splitStr = payload.detail.controlNo.split("-");
        const oldControlNo = splitStr[3];
        const oldControlNoNum = Number(oldControlNo) + 1;
        const oldControlNoStr = oldControlNoNum.toString();
        let temp = "";
        if (oldControlNoStr.length == 1) temp = "00" + oldControlNoStr
        if (oldControlNoStr.length == 2) temp = "0" + oldControlNoStr
        newControlNo = `${splitStr[0]}-${splitStr[1]}-${splitStr[2]}-${temp}-${splitStr[4]}-${splitStr[5]}`;
    }

    payload.detail.controlNo = newControlNo;
    const createRequestFormResult = await createRequestForm(payload);
    const createFormStep1Result = await createFormStep1Detail(
        payload,
        createRequestFormResult._id
    );
    const createFormStep2Result = await createFormStep2TestPurpose(
        payload,
        createRequestFormResult._id
    );
    const createFormStep3Result = await createFormStep3TestingType(
        payload,
        createRequestFormResult._id
    );
    const createFormStep4Result = await createFormStep4TestingCondition(
        payload,
        createRequestFormResult._id
    );
    const createFormStep5Result = await createFormStep5UserApprove(
        payload,
        createRequestFormResult._id
    );
    // console.log(createFormStep1Result);
    // console.log(createFormStep2Result);
    // res.statusCode = 200;
    res.sendStatus(200);
});

async function checkDuplicateRequestNo(controlNo) {
    return await request_form
        .aggregate([{
            $match: {
                controlNo: controlNo,
            },
        }, ])
        .limit(1);
}

async function createRequestForm(body) {
    const data = {
        userId: body.request._id,
        date: new Date(),
        controlNo: body.detail.controlNo,
    };
    return await request_form.create(data);
}
async function createFormStep1Detail(body, requestId) {
    const data = {
        requestId: requestId,
        ...body.detail,
    };
    return await formStep1Detail.create(data);
}

async function createFormStep2TestPurpose(body, requestId) {
    const data = {
        requestId: requestId,
        ...body.testPurpose,
    };
    return await formStep2TestPurpose.create(data);
}
async function createFormStep3TestingType(body, requestId) {
    const data = {
        requestId: requestId,
        ...body.testingType.data,
    };
    return await formStep3TestingType.create(data);
}
async function createFormStep4TestingCondition(body, requestId) {
    const data = {
        requestId: requestId,
        data: body.testingCondition,
    };
    return await formStep4TestingCondition.create(data);
}
async function createFormStep5UserApprove(body, requestId) {
    const data = {
        ...body.userApprove,
        requestId: requestId,
    };
    return await formStep5UserApprove.create(data);
}

// router.post("/insert", async(req, res, next) => {
//     let body = req.body;
//     const result = await request_form.aggregate([{
//         $match: {
//             "step1.controlNo": body.step1.controlNo,
//         },
//     }, ]);
//     if (result.length > 0) {
//         const result = await request_form
//             .aggregate([])
//             .sort({ createdAt: -1 })
//             .limit(1);
//         body.step1.controlNo = await genControlNo(result[0]);
//         request_form.insertMany(body, (err, result) => {
//             if (err) {
//                 res.json(err);
//             } else {
//                 const text = `duplicate control no. Now changed to ${result[0].step1.controlNo}`;
//                 res.json({ msg: text });
//             }
//         });
//     } else {
//         request_form.insertMany(body, (err, result) => {
//             if (err) {
//                 res.json(err);
//             } else {
//                 res.json(result);
//             }
//         });
//     }
// });

function genControlNo(result) {
    return new Promise((resolve) => {
        const res_split = result.step1.controlNo.split("-");
        let newControlNo = (Number(res_split[3]) + 1).toString();
        newControlNo.length === 1 ?
            (newControlNo = "00" + newControlNo) :
            newControlNo;
        newControlNo.length === 2 ?
            (newControlNo = "0" + newControlNo) :
            newControlNo;
        resolve(
            `${res_split[0]}-${res_split[1]}-${res_split[2]}-${newControlNo}-${res_split[4]}-${res_split[5]}`
        );
    });
}

router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    request_form
        .updateMany({ _id: id }, { $set: req.body })
        .exec((err, result) => {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
        });
});

router.delete("/delete/:id", async(req, res, next) => {
    const { id } = req.params;
    let arr = [];
    arr.push(await request_form.deleteMany({ requestId: id }));
    arr.push(await formStep1Detail.deleteMany({ requestId: id }));
    arr.push(await formStep2TestPurpose.deleteMany({ requestId: id }));
    arr.push(await formStep3TestingType.deleteMany({ requestId: id }));
    arr.push(await formStep4TestingCondition.deleteMany({ requestId: id }));
    arr.push(await formStep5UserApprove.deleteMany({ requestId: id }));
    Promise.all(arr)
        .then((result) => {
            res.sendStatus(200);
        })
        .catch((err) => res.json(err));
});

router.post("/count", (req, res, next) => {
    const condition = [{
            $match: {
                createdAt: {
                    $gte: new Date(req.body.date),
                },
                "step1.corporate": {
                    $eq: req.body.corporate,
                },
            },
        },
        {
            $count: "document",
        },
    ];
    request_form.aggregate(condition).exec((err, result) => {
        res.json(result);
    });
});

module.exports = router;