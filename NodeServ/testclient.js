// This is a comment
var socket = require('socket.io-client')('http://IP:PORT');
var prompt = require('prompt')
socket.on('connect', function() { console.log('TestClient connected to Server') });
var myID = "";
prompt.start();


/*socket.emit('make account', {
    email: 'drsam94@gmail.com',
    name: 'SrgtSetsuna'
})*/

socket.on('make account', function(data) {
    myID = data.sbID;
    console.log(myID);
//    socket.emit('login', data)
})
//socket.emit('login', { sbID: myID })
socket.on('login', function(data) {
    if (data.success === true) {
        console.log('I logged in!');
        console.log(data);
    } else {
        console.log('login failed');
    }
})

socket.on('dump account data', function(data) {
    for (var i = 0; i < data.length; ++i) {
        console.log(data[i]);
    }
})

function promptAndExec() {
    console.log('Enter Command:\n[M]ake Account\n[L]ogin\n[D]ata\n[E]nd')
    console.log()

    prompt.get(['command'], function (err, result) {
        if (err) { console.log(err); return; }
        var comm = result.command.toLowerCase()[0];
        if (comm === 'm') {
            prompt.get(['name', 'email'], function(err, result) {
                if (err) { console.log(err); return; }
                socket.emit('make account', { name: result.name, email: result.email});
                promptAndExec();
            })
        } else if (comm === 'l') {
            if (myID != "") {
                console.log('Press Enter to use last login ID');
            }
            prompt.get(['sbID',], function(err, result) {
                if (err) { console.log(err); return; }
                var id = result.sbID;
                if (id === "") { id = myID }
                socket.emit('login', {sbID : id});
                promptAndExec();
            })
        } else if (comm === 'd') {
            console.log('asking for dump');
            socket.emit('dump account data', { code: 'catfish'});
        }
    })
}

promptAndExec();
