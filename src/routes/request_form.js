let express = require("express");
let router = express.Router();

const request_form = require("../models/request_form");
const formStep1Detail = require("../models/form-step1-detail");
const formStep2TestPurpose = require("../models/form-step2-testPurpose");
const formStep3TestingType = require("../models/form-step3-testingType");
const formStep4TestingCondition = require("../models/form-step4-testingCondition");
const formStep5UserApprove = require("../models/form-step5-userApprove");
const userModel = require("../models/user");
const queue = require("../models/queue");

const ObjectId = require("mongodb").ObjectID;

router.get("", (req, res, next) => {
    request_form.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

// TODO get data by id and lookup all
router.get("/id/:id", (req, res, next) => {
    const { id } = req.params;

    const condition = [{
            $match: {
                _id: ObjectId(id),
            },
        },
        {
            $project: {
                _id: {
                    $toString: "$_id",
                },
                status: "$status",
                table: "$table",
            },
        },
        {
            $lookup: {
                from: "formstep1details",
                localField: "_id",
                foreignField: "requestId",
                as: "step1",
            },
        },
        {
            $lookup: {
                from: "formstep2testpurposes",
                localField: "_id",
                foreignField: "requestId",
                as: "step2",
            },
        },
        {
            $lookup: {
                from: "formstep3testingtypes",
                localField: "_id",
                foreignField: "requestId",
                as: "step3",
            },
        },
        {
            $lookup: {
                from: "formstep4testingconditions",
                localField: "_id",
                foreignField: "requestId",
                as: "step4",
            },
        },
        {
            $lookup: {
                from: "formstep5userapproves",
                localField: "_id",
                foreignField: "requestId",
                as: "step5",
            },
        },
        {
            $lookup: {
                from: "queues",
                localField: "_id",
                foreignField: "work.requestId",
                as: "queues",
            },
        },
        {
            $project: {
                step1: {
                    $first: "$step1",
                },
                step2: {
                    $first: "$step2",
                },
                step3: {
                    $first: "$step3",
                },
                step4: {
                    $first: "$step4",
                },
                step5: "$step5",
                status: "$status",
                table: "$table",
                queues: "$queues",
            },
        },
    ];

    request_form.aggregate(condition).exec((err, result) => {
        if (err) res.json(err);
        res.json(result);
    });
});

// TODO get to table
router.get("/table/:userId/:status", async(req, res, next) => {
    console.log(req.params);
    const { userId, status } = req.params;
    const newStatus = JSON.parse(status);
    const approve = await formStep5UserApprove.aggregate([{
        $match: {
            userId: userId,
        },
    }, ]);
    const requestId = approve.map((ap) => ap.requestId);
    console.log(requestId);

    const condition = [{
            $project: {
                requestId: {
                    $toString: "$_id",
                },
                status: "$status",
                nextApprove: "$nextApprove",
                createdAt: "$createdAt",
                updatedAt: "$updatedAt",
            },
        },
        {
            $match: {
                requestId: {
                    $in: requestId,
                },
                status: {
                    $in: newStatus,
                },
            },
        },
        {
            $lookup: {
                from: "formstep1details",
                localField: "requestId",
                foreignField: "requestId",
                as: "step1",
            },
        },
        {
            $lookup: {
                from: "formstep5userapproves",
                localField: "requestId",
                foreignField: "requestId",
                as: "step5",
            },
        },
        {
            $project: {
                requestId: "$requestId",
                controlNo: {
                    $first: "$step1.controlNo",
                },
                lotNo: {
                    $first: "$step1.lotNo",
                },
                modelNo: {
                    $first: "$step1.modelNo",
                },
                step5: "$step5",
                status: "$status",
                nextApprove: "$nextApprove",
                createdAt: "$createdAt",
                updatedAt: "$updatedAt",
            },
        },
    ];

    request_form
        .aggregate(condition)
        .sort({ createdAt: -1 })
        .exec((err, result) => {
            if (err) res.json(err);
            res.json(result);
        });
});

// TODO get to table manage
router.get(
    "/tableManage/:userId/:status/:limit/:skip/:sort/:count",
    async(req, res, next) => {
        const { userId, status, limit, skip, sort, count } = req.params;
        console.log(req.params);
        const newStatus = JSON.parse(status);
        console.log(newStatus);

        let approve = await formStep5UserApprove.aggregate([{
            $match: {
                userId: userId,
            },
        }, ]);

        res.json(approve);
    }
);

router.get("/condition/:userId/:status", (req, res, next) => {
    let { userId, status } = req.params;
    status = JSON.parse(status);
    const condition = [{
            $match: {
                userId: userId,
                status: {
                    $in: status,
                },
            },
        },
        {
            $project: {
                _id: {
                    $toString: "$_id",
                },
            },
        },
        {
            $lookup: {
                from: "formstep1details",
                localField: "_id",
                foreignField: "requestId",
                as: "step1",
            },
        },
        {
            $lookup: {
                from: "formstep2testpurposes",
                localField: "_id",
                foreignField: "requestId",
                as: "step2",
            },
        },
        {
            $lookup: {
                from: "formstep3testingtypes",
                localField: "_id",
                foreignField: "requestId",
                as: "step3",
            },
        },
        {
            $lookup: {
                from: "formstep4testingconditions",
                localField: "_id",
                foreignField: "requestId",
                as: "step4",
            },
        },
        {
            $lookup: {
                from: "formstep5userapproves",
                localField: "_id",
                foreignField: "requestId",
                as: "step5",
            },
        },
    ];
    request_form.aggregate(condition).exec((err, result) => {
        if (err) res.json(err);
        res.json(result);
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

    if (payload && payload._id) {
        const temp = {
            userId: payload._id,
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

router.post("/draft", async(req, res, next) => {
    let payload = req.body;
    const resultDuplicate = await checkDuplicateRequestNo(payload.controlNo);
    let newControlNo = "";
    if (resultDuplicate.length === 0) {
        newControlNo = payload.controlNo;
    } else {
        const splitStr = payload.controlNo.split("-");
        const lastRecord = await request_form
            .aggregate([{
                $match: {
                    corporate: splitStr[0].toLowerCase(),
                },
            }, ])
            .sort({ createdAt: -1 })
            .limit(1);
        const oldControlNo = lastRecord[0].controlNo.split("-")[3];
        const oldControlNoNum = Number(oldControlNo) + 1;
        const oldControlNoStr = oldControlNoNum.toString();
        let temp = "";
        if (oldControlNoStr.length == 1) temp = "00" + oldControlNoStr;
        if (oldControlNoStr.length == 2) temp = "0" + oldControlNoStr;
        newControlNo = `${splitStr[0]}-${splitStr[1]}-${splitStr[2]}-${temp}-${splitStr[4]}`;
        payload.controlNo = newControlNo
    }
    const createRequestFormResult = await request_form.insertMany(payload)
    res.json(createRequestFormResult)
});


router.post("/insert", async(req, res, next) => {
    let payload = req.body;
    // console.log(payload);
    const resultDuplicate = await checkDuplicateRequestNo(
        payload.detail.controlNo
    );
    let newControlNo = "";
    if (resultDuplicate.length === 0) {
        newControlNo = payload.detail.controlNo;
    } else {
        const splitStr = payload.detail.controlNo.split("-");
        const lastRecord = await request_form
            .aggregate([{
                $match: {
                    corporate: splitStr[0].toLowerCase(),
                },
            }, ])
            .sort({ createdAt: -1 })
            .limit(1);
        // console.log(lastRecord);
        // const oldControlNo = splitStr[3];
        const oldControlNo = lastRecord[0].controlNo.split("-")[3];
        const oldControlNoNum = Number(oldControlNo) + 1;
        const oldControlNoStr = oldControlNoNum.toString();
        let temp = "";
        if (oldControlNoStr.length == 1) temp = "00" + oldControlNoStr;
        if (oldControlNoStr.length == 2) temp = "0" + oldControlNoStr;
        newControlNo = `${splitStr[0]}-${splitStr[1]}-${splitStr[2]}-${temp}-${splitStr[4]}-${splitStr[5]}`;
    }

    payload.detail.controlNo = newControlNo;
    const userApprove = await userModel.findById(payload.userApprove.userId);
    const createRequestFormResult = await createRequestForm(payload, userApprove);
    await filesManage(createRequestFormResult, payload.detail.files);
    await createFormStep1Detail(payload, createRequestFormResult._id);
    await createFormStep2TestPurpose(payload, createRequestFormResult._id);
    await createFormStep3TestingType(payload, createRequestFormResult._id);
    await createFormStep4TestingCondition(payload, createRequestFormResult._id);
    await createFormStep5UserRequest(payload, createRequestFormResult._id);
    await createFormStep5UserApprove(payload, createRequestFormResult._id);
    // console.log(createFormStep1Result);
    // console.log(createFormStep2Result);
    // res.statusCode = 200;
    res.json(createRequestFormResult);
});

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
    arr.push(await request_form.deleteMany({ _id: id }));
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

router.delete("/deleteAll/", async(req, res, next) => {
    const request = await request_form.aggregate([
        { $match: {} },
        {
            $project: {
                id: {
                    $toString: "$_id",
                },
            },
        },
    ]);
    let arr = [];
    if (request.length > 0) {
        for (let index = 0; index < request.length; index++) {
            arr.push(await request_form.deleteMany({ _id: request[index].id }));
            arr.push(
                await formStep1Detail.deleteMany({ requestId: request[index].id })
            );
            arr.push(
                await formStep2TestPurpose.deleteMany({ requestId: request[index].id })
            );
            arr.push(
                await formStep3TestingType.deleteMany({ requestId: request[index].id })
            );
            arr.push(
                await formStep4TestingCondition.deleteMany({
                    requestId: request[index].id,
                })
            );
            arr.push(
                await formStep5UserApprove.deleteMany({ requestId: request[index].id })
            );
            arr.push(await queue.deleteMany({ "work.requestId": request[index].id }));
            if (index + 1 == request.length) {
                Promise.all(arr)
                    .then((result) => {
                        res.sendStatus(200);
                    })
                    .catch((err) => res.json(err));
            }
        }
    } else {
        res.sendStatus(400);
    }
});

router.post("/count", (req, res, next) => {
    const condition = [{
            $match: {
                createdAt: {
                    $gte: new Date(req.body.date),
                },
                corporate: {
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

async function checkDuplicateRequestNo(controlNo) {
    return await request_form
        .aggregate([{
            $match: {
                controlNo: controlNo,
            },
        }, ])
        .limit(1);
}

async function createRequestForm(body, userApprove) {
    const data = {
        userId: body.request._id,
        date: new Date(),
        controlNo: body.detail.controlNo,
        corporate: body.detail.corporate,
        status: "request",
        nextApprove: userApprove._doc,
    };
    return await request_form.create(data);
}

async function filesManage(request, files) {
    console.log(request, files);
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
        data: body.testingType.data,
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
    const user = await userModel.findById(body.userApprove.userId);
    const data = {
        requestId: requestId,
        authorize: body.userApprove.authorize,
        userId: body.userApprove.userId,
        userName: user.name || "",
        statusApprove: false,
        dateApprove: null,
        level: 2,
    };
    return await formStep5UserApprove.create(data);
}
async function createFormStep5UserRequest(body, requestId) {
    const user = await userModel.findById(body.request._id);

    const data = {
        requestId: requestId,
        authorize: "request",
        userId: body.request._id,
        userName: user.name,
        statusApprove: true,
        dateApprove: body.userApprove.dateApprove,
        level: 1,
    };
    return await formStep5UserApprove.create(data);
}

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

module.exports = router;