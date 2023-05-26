require("dotenv").config();
let express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");
let app = express();
let morgan = require("morgan");
app.use(bodyParser.json());
app.use(cors());
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
let mongooseConnect = require("./connect");

const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
let user = require("./src/routes/user.js");
// let request = require('./src/routes/request.js')
let authorize_master = require("./src/routes/authorize_master.js");
let department_master = require("./src/routes/department");
let section_master = require("./src/routes/section");
let model_master = require("./src/routes/model_master");
let test_purpose_master = require("./src/routes/test_purpose_master");
let testing_type_master = require("./src/routes/testing_type_master");
let testing_condition_master = require("./src/routes/testing_condition_master");
let interval_master = require("./src/routes/interval_master");
let request_form = require("./src/routes/request_form");
let files = require("./src/routes/files");
let log_flow = require("./src/routes/log_flow");
let userApprove = require("./src/routes/userApprove");
let operate_group = require("./src/routes/operate_group");
let operate_items = require("./src/routes/operate_items");
let function_chamber = require("./src/routes/function_chamber");
let chamber_list = require("./src/routes/chamber_list");
let queue = require("./src/routes/queue");
let queue_revises = require("./src/routes/queue-revises");
let report = require("./src/routes/report");
let step1 = require("./src/routes/step1");
let step2 = require("./src/routes/step2");
let step3 = require("./src/routes/step3");
let step4 = require("./src/routes/step4");
let step5 = require("./src/routes/step5");
let mailer = require("./src/routes/mailer");
let approver = require("./src/routes/approver");
let request_revises = require("./src/routes/request_revises");

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log("Listening on  port " + server.address().port);
});

app.use(morgan("tiny"));
app.use("/user", user);
// app.use('/request', request)
app.use("/authorize_master", authorize_master);
app.use("/section_master", section_master);
app.use("/department_master", department_master);
app.use("/model_master", model_master);
app.use("/test_purpose_master", test_purpose_master);
app.use("/testing_type_master", testing_type_master);
app.use("/testing_condition_master", testing_condition_master);
app.use("/interval_master", interval_master);
app.use("/request_form", request_form);
app.use("/files", files);
app.use("/log_flow", log_flow);
app.use("/userApprove", userApprove);
app.use("/operate_group", operate_group);
app.use("/operate_items", operate_items);
app.use("/function_chamber", function_chamber);
app.use("/chamber_list", chamber_list);
app.use("/queue", queue);
app.use("/queues_revises", queue_revises);
app.use("/report", report);
app.use("/step1", step1);
app.use("/step2", step2);
app.use("/step3", step3);
app.use("/step4", step4);
app.use("/step5", step5);
app.use("/mail", mailer);
app.use("/approver", approver);
app.use("/request_revises", request_revises);
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST ,PUT ,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-with,Content-Type"
  );
  res.setHeader("Access-Conrol-Allow-Credentials", true);
  next();
});

module.exports = app;
