var mongoose = require("mongoose");
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((value) => {
    console.log(
      "mongodb connected" +
        "\n" +
        value.connection._connectionString +
        "\nport: " +
        value.connection.port +
        "\nPATH_IMAGE:" +
        process.env.PATH_IMAGE +
        "\nURL_DOWNLOAD:" +
        process.env.URL_DOWNLOAD +
        "\nURL_MAIL:" +
        process.env.URL_MAIL
    );
  })
  .catch((reason) => console.log(reason));
module.exports = mongoose;
