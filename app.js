require("dotenv").config();
let express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");
let app = express();
let morgan = require("morgan");
app.use(bodyParser.json());
app.use(cors());
let mongoose = require("./connect");


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

module.exports = app;