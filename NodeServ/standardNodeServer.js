/*Duel Game Server-Side Code
Author: Sam Donow

The MIT License (MIT)

Copyright (c) 2015 Samuel Donow <drsam94@gmail.com>, Nigel Munoz <nigelmnz.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.*/

var app = require('http').createServer()//handler)
var io = require('socket.io')(app);
var mongoose = require('mongoose');
var fs         = require('fs');
var _file = "./log/log.log";
//If you want a different log per session:
//var _file = "./log/" + (new Date()).toISOString().replace(/:/g,'_') + ".log";
function log(data) {
    var s = (new Date()).toGMTString() + ": " + data;
    fs.writeFile(_file, s);
    console.log(data)
}
var db = mongoose.connection;
mongoose.connect('mongodb://localhost/mdgdb')//PUT YOUR OWN DATABASE HERE
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log('Connected to Databse');
    require('./gameserver.js')(io, db, mongoose, log)
});

app.listen(4567);//Completely arbitrary port
console.log('This is the Standard Server')
