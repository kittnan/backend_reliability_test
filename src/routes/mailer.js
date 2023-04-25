let express = require("express");
let router = express.Router();
const mailConfig = require("../models/mail-config");
const users = require("../models/user");
const nodemailer = require("nodemailer");
const ObjectId = require("mongodb").ObjectID;
const Step1 = require("../models/form-step1-detail");

router.get("", (req, res, next) => {
  mailConfig.find({}).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.post("/insert", async (req, res, next) => {
  mailConfig.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.put("/update/:id", (req, res, next) => {
  const { id } = req.params;
  mailConfig.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/delete/:id", (req, res, next) => {
  const { id } = req.params;
  mailConfig.deleteOne({ _id: id }).exec((err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.post("/foo", async (req, res, next) => {
  const doo = await Step1.aggregate([
    {
      $match: {
        controlNo: req.body.controlNo,
      },
    },
  ]);
  res.json(doo);
});

router.post("/send", async (req, res, next) => {
  const payload = req.body;
  // let ccUser = payload.cc;
  let ccUser = payload.cc.map((s) => ObjectId(s));
  ccUser = await users.aggregate([
    {
      $match: {
        _id: {
          $in: ccUser,
        },
      },
    },
  ]);
  ccUser = ccUser.map((u) => u.email);
  ccUser = [...new Set(ccUser)];

  // let toUserId = payload.to;
  let toUserId = payload.to.map((s) => ObjectId(s));
  // console.log(toUserId);
  let toUsers = await users.aggregate([
    {
      $match: {
        _id: {
          $in: toUserId,
        },
      },
    },
  ]);

  toUsers = toUsers.map((u) => u.email);
  toUsers = [...new Set(toUsers)];
  const mail = await mailConfig.aggregate([{ $match: {} }]);
  const step1 = await Step1.aggregate([
    { $match: { requestId: payload.formId } },
  ]);
  // console.log(step1);
  const detailText = `
  <p>Request No. : ${step1[0].controlNo}</p>
  <p>Request Subject : ${
    step1[0]?.requestSubject ? step1[0]?.requestSubject : "-"
  }</p>
  `;
  let link = genLink(payload.status, payload.formId);
  let text1 = genText1(payload.status, payload.at);
  let footer = `
  <p>
  -------------------------------------------------------------
  </p>
  <p>
  This E-mail is automatically sent to you by system. Please do not reply.
  </p>
  <p>
  อีเมลล์นี้เป็นข้อมูลส่งอัตโนมัติโดยระบบ กรุณาอย่าตอบกลับ
  </p>
  <p>
  Please kindly contact 
  </p>
  <p>
  กรุณาติดต่อที่
  </p>
  <p>
  QE Tel :1569 , 1109
E-mail : phanutchakorn-s@kyocera.co.th, sangjan-j@kyocera.co.th
</p>
  `;
  console.log("toUsers", toUsers);
  let body = `
        <p>
       ${text1}
    </p>
    ${detailText}
    <p>
        Below link
    </p>
    <p>
        -------------------------------------------------------------
    </p>
    <a href="${link}">
    CLICK
    </a>
    ${footer}
    `;

  if (payload.status.includes("reject")) {
    body = `
        <p>
        ${text1}
    </p>
    ${detailText}
    <p>
        Below link
    </p>
    <p>
        -------------------------------------------------------------
    </p>
    <a href="${link}">
    CLICK
    </a>
    ${footer}`;
  }

  let transporter = nodemailer.createTransport({
    host: mail[0].host,
    port: mail[0].port,
    secure: false,
    auth: {
      user: mail[0].auth.user,
      pass: mail[0].auth.pass,
    },
    // auth: mail[0].auth,
  });

  try {
    let info = await transporter.sendMail({
      from: mail[0].from, // sender address
      to: toUsers, // list of receivers
      cc: ccUser,
      subject: mail[0].subject, // Subject line
      html: body,
    });
    res.json(info);
  } catch (error) {
    console.log("@error", error);
  }
});

function genLink(status, formId) {
  const base = process.env.URL_MAIL;
  switch (status) {
    case "request_approve":
      return `${base}/approve/approve-request?id=${formId}&status=${status}`;
      break;
    case "qe_window_person":
      return `${base}/qe-window-person/chamber?id=${formId}&status=${status}`;
      break;
    case "qe_engineer":
      return `${base}/qe-engineer/approve-request?id=${formId}&status=${status}`;
      break;
    case "qe_engineer2":
      return `${base}/qe-engineer/approve-request?id=${formId}&status=${status}`;
      break;
    case "qe_section_head":
      return `${base}/qe-section-head/approve-request?id=${formId}&status=${status}`;
      break;
    case "request_confirm":
      return `${base}/request/confirm?id=${formId}&status=${status}`;
      break;
    case "request_confirm_edited":
      return `${base}/request/confirm?id=${formId}&status=${status}`;
      break;
    case "qe_window_person_report":
      return `${base}/qe-window-person/report?id=${formId}&status=${status}`;
      break;
    case "request_confirm_revise":
      return `${base}/request/confirm?id=${formId}&status=${status}`;
      break;

    case "reject_request":
      return `${base}/request/sheet?id=${formId}&status=${status}`;
      break;

    case "reject_request_approve":
      return `${base}/approve/approve-request?id=${formId}&status=${status}`;
      break;

    case "reject_qe_window_person":
      return `${base}/qe-window-person/chamber?id=${formId}&status=${status}`;
      break;

    case "reject_qe_engineer":
      return `${base}/qe-engineer/approve-request?id=${formId}&status=${status}`;
      break;

    // case "reject_request_confirm":
    //   return `${base}/qe-window-person/chamber?id=${formId}&status=${status}`;
    //   break;

    case "deleteReport":
      return `${base}/view-page?id=${formId}&status=${status}`;
      break;

    case "uploadReport":
      return `${base}/view-page?id=${formId}&status=${status}`;
      break;

    case "finish":
      return `${base}/view-page?id=${formId}&status=${status}`;
      break;

    default:
      break;
  }
}

function genText1(statusForm, at) {
  switch (statusForm) {
    case "request_approve":
      return `Please review and approval request reliability test​`;
      break;
    case "qe_window_person":
      return `Please review request reliability test​`;
      break;
    case "qe_engineer":
      return `Please review and approval request reliability test​`;
      break;
    case "qe_engineer2":
      return `Please review and approval request reliability test​`;
      break;
    case "qe_section_head":
      return `Please review and approval request reliability test`;
      break;
    case "request_confirm":
      return `Approval request reliability test​`;
      break;
    case "request_confirm_edited":
      return `Please review and approval request reliability test​`;
      break;
    case "qe_window_person_report":
      return `Please make report request reliability test​`;
      break;
    case "request_confirm_revise":
      return `Approval request reliability test​`;
      break;

    case "reject_request":
      return `Reject : Request reliability test`;
      break;

    case "reject_request_approve":
      return `Reject : Request reliability test`;
      break;

    case "reject_qe_window_person":
      return `Reject : Request reliability test`;
      break;

    case "reject_qe_engineer":
      return `Reject : Request reliability test`;
      break;

    // case "reject_request_confirm":
    //   return `${base}/qe-window-person/chamber?id=${formId}&status=${status}`;
    //   break;

    case "deleteReport":
      return `QE delete report at ${at} Hr.`;
      break;

    case "uploadReport":
      return `Update result reliability test at ${at} Hr.​`;
      break;

    case "finish":
      return `Completed reliability test.​`;
      break;

    default:
      "";
      break;
  }
}

module.exports = router;
