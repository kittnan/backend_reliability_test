// const mongoose = require('mongoose');
// var uri = 'mongodb://10.200.90.152:27017/AEProject'


// mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).catch(error => handleError(error))
// mongoose.connect('mongodb://10.200.90.152:27017/InsMatrix', { useNewUrlParser: true, useUnifiedTopology: true });

var mongoose = require('mongoose');
// mongoose.connect('mongodb://10.200.90.152:27017/AEProject', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect('mongodb://boat:boat@localhost/reliability', { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (err) throw err
    console.log(`connect db success`);
});

module.exports = mongoose;



// module.exports = mongoose;