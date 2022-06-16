let express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");
let app = express();

app.use(bodyParser.json());
app.use(cors());

let request = require('./src/routes/request.js')

const port = 4070;
const server = app.listen(port, () => {
    console.log("Listening on  port " + server.address().port);
});

app.use('/request', request)


module.exports = app;