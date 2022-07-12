let express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");
let app = express();

app.use(bodyParser.json());
app.use(cors());
let mongoose = require("./connect")
let user = require('./src/routes/user.js')
    // let request = require('./src/routes/request.js')
let authorize_master = require('./src/routes/authorize_master.js')
let department_master = require('./src/routes/department')
let model_master = require('./src/routes/model_master')
let test_purpose_master = require('./src/routes/test_purpose_master')
let testing_type_master = require('./src/routes/testing_type_master')
let interval_master = require('./src/routes/interval_master')
let request_form = require('./src/routes/request_form')
let files = require('./src/routes/files')

const port = 4070;
const server = app.listen(port, () => {
    console.log("Listening on  port " + server.address().port);
});

app.use('/user', user)
    // app.use('/request', request)
app.use('/authorize_master', authorize_master)
app.use('/department_master', department_master)
app.use('/model_master', model_master)
app.use('/test_purpose_master', test_purpose_master)
app.use('/testing_type_master', testing_type_master)
app.use('/interval_master', interval_master)
app.use('/request_form', request_form)
app.use('/files', files)


module.exports = app;