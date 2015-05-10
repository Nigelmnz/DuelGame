var app = require('http').createServer()//handler)
var io = require('socket.io')(app);
var mongoose = require('mongoose');
var fs         = require('fs');
var _file = "./log/log.log";//(new Date()).toISOString().replace(/:/g, '_') + ".log";
function log(data) {
    var s = (new Date()).toGMTString() + ": " + data;
    fs.writeFile(_file, s);
    console.log(data)
}
var db = mongoose.connection;
mongoose.connect('mongodb://localhost/mdgdb')
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log('Connected to Databse');
    require('./gameserver.js')(io, db, mongoose, log)
});

app.listen(5678);
console.log('This is the Test Server')
