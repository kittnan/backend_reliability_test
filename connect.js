var mongoose = require("mongoose");
mongoose.connect(
    process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true },
    (err, db) => {
        if (err) throw err;
        console.log(`connect db success`);
    }
);

module.exports = mongoose;