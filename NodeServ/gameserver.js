/******
Duel Game Server-Side Code
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
THE SOFTWARE.

****/

//Just a nice utility function to have around
Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

Array.prototype.remove = function(arr, obj) {
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i] == obj) {
            arr.splice(i, 1);
            return;
        }
    }
}
Array.prototype.sum = function() {
    var sum = 0;
    for (var i = 0; i < this.length; ++i) {
        sum += this[i];
    }
    return sum;
}

String.prototype.format = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

var ErrorCode = {
    ILLEGAL_ACTION : 100,
    DATABASE_ERROR  : 200,
    ACCOUNT_DOES_NOT_EXIST : 301
}
var CharData   = require("./characters.js");
var storeData  = require("./shopData.js");

var email      = require("emailjs/email");
var sanitizeHtml = require('sanitize-html');

var server     = email.server.connect({
    user: "admin@sufferbox.com",//Put your email here
    password: "******",//Put a real password here
    host: 'mailout.easymail.ca',
    ssl : true
});

function sendMail(recipient, name, subject, message) {
    server.send({
        text: message,
        from: "Sufferbox Games <admin@sufferbox.com>",
        to: name + " <" + recipient + ">",
        subject: subject,
        attachment: [{data : "<html>" + message + "</html>", alternative: true}]
    }, function(err, message) { if (err) { log(err); } else { console.log("Sent Email")}});
}

module.exports = function(io, db, mongoose, log) {
/**
    Player:
        Characters
            --Set of unlocked abilities
            --Level
            --Hats/Skin
        Equipment
            --Set of things they have
        LoadOuts
            --Character
                --Subset of abilities
                --Subset of equipment
                --Hat/Skin

    Looking into Google Play Purchase API (Server side)

    Store Implementation (Reasonably emulate in test client)

    Friending

    Password encryption / emailing / etc

    Checking for loss state / Checking SBEs
*/
// Wrapper around a silly thing
var currentTime = function() {
    return Date.now();
}

log('Received Connection');
var playerSchema = mongoose.Schema({
    gold : Number,
    hats : [Number],
    characters : [ {index: Number, level: Number} ],
    badges: [Number],
    loadOuts: [ { name : String,
                  character: Number,
                  attacks: [Number],
                  badges : [Number],
                  hats : [Number]
                  } ],
    name : String,
    rating : Number,
    friends : [String],
    sbID :  String,
    notifications : [ {subject : String, text: String} ],
    privateInfo : {
        email : String,
        password : String,
        loginTimes : [Number]
    }
});


var Account = mongoose.model('Account', playerSchema)
//taken from codeheart, Morgan McGuire
function generateUniqueID() {

// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-xx9x-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c == 'x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
}

function saneString(str) {
    var ret = (str.length > 0) && (str.length < 32);
    ret = ret && (! /[\x00-\x1F]/.test(str));
    ret = ret && (str === sanitizeHtml(str, {allowedTags: []}));
    return ret;
}

function _Unit(loadOut) {
    return {
        character : loadOut.character,
        badges : loadOut.badges,
        attacks: loadOut.attacks,
        hats : loadOut.hats,
        account : account,
        health : 0,
        resources : [0, 0, 0],
        stats : {
            speed : 0,
            maxHealth : 0,
            maxResources: [0, 0, 0],
            attack : 0,
            defense : 0
        },
        //Modifiers:

        // [ {stat: String, amount: Number, rounds: Number }]
        modifiers : [],
        // status: String, rounds: Number
        status : []
    }
}
/*
function _Player(id, account, loadOut1, loadOut2) {
    return {
        id: id,
        name: account.name,
        account: account,
        units: [
            Unit(loadOut1), Unit(loadOut2)
        ]

    }
}
*/

/** Constructor for a Player, which contains information both about
  * The associated account and load out
  */
function Player(id, account, loadOut) {
    return {
        id : id,
        name : account.name,
        character : loadOut.character,
        badges : loadOut.badges,
        attacks: loadOut.attacks,
        hats : loadOut.hats,
        account : account,
        health : 0,
        resources : [0, 0, 0],
        stats : {
            speed : 0,
            maxHealth : 0,
            maxResources: [0, 0, 0],
            attack : 0,
            defense : 0
        },
        //Modifiers:

        // [ {stat: String, amount: Number, rounds: Number }]
        modifiers : [],
        // status: String, rounds: Number
        status : []
    }
}


function Game(id, player) {
    return {
        players : [player, undefined],
        id : id,
        lastEvent : {},
        queuedActions : [],
        currentAction: {
            active: false
        },
        begun : false,
        ready: 0
    }
}

var appState = {};
/** App States */
var GS_STARTMENU    = 0;
var GS_JOINING      = 1;
var GS_READY        = 2;
var GS_INTERMEDIARY = 7;
var GS_PLAYING      = 3;
var GS_SIDEBOARDING = 4;
var GS_EDITING      = 5;
var GS_SHOP         = 6;


var users = 0;
var openGames = [];
var playersWaitingForGames = [];
var clientIDtoGameState = {};
var gameStartingLock = null;

log("Server is Running...");
Account.count({}, function(err, count) { log("# of accounts: " + count); });
io.on('connection', function (socket) {
    ++users;
    appState[socket.id] = GS_STARTMENU;
    var myAccount = null;

    var getGame    = function() {
        return clientIDtoGameState[socket.id];
    }

    //Get an array of players, with the player whose ID is firstID is first
    var getPlayersOrderedBy = function(firstId) {
        var game = getGame();
        if (game.players[0].id === firstId) {
            return game.players;
        } else {
            return [game.players[1], game.players[0]];
        }
    }

    //By default, use socket.id as firstID
    var getPlayers = function() {
        return getPlayersOrderedBy(socket.id);
    }


    //Verify that the active player (the one corresponding to this socket) is the passed in player
    var verifyActivePlayer = function(player) {
        if (socket.id !== player.id) {
            log("ERROR: NON-ACTIVE PLAYER DID SOMETHING")
            return false;
        }
        return true;
    }

    //Checks if an attack/action is legal
    var verifyIsLegalAttack = function(data, unit) {
        return true;

        if (! unit.attacks.contains(data.index)) {
            log("Illegal Attack")
            log("Index:" + data.index)
            log("Attacks:" +  unit.attacks)
            return false;
        }
        for (var i = 0; i < unit.resources.length; ++i) {
            var attack = actionData.characters[unit.character].attacks[data.index]
            if (unit.resources[i] > attack.resourceCost[i]) {
                log("Illegal Attack")
                log("Resource Cost:" + attack.resourceCost)
                log("Resources:" + unit.resources)
                return false;
            }
        }
        return true;
    }


    var numberify = function(data, fields) {
        for (var i = 0; i < fields.length; ++i) {
            data[fields[i]] = Number(data[fields[i]]);
        }
        return data;
    }


    var emitToPlayers = function(players, msg, data) {
        for (var i = 0; i < players.length; ++i) {
            data.me = (i == 0);
            if (data.me) log(players[0].name)
            io.sockets.in(players[i].id).emit(msg, data);
        }
    }
    var sendPlayerData = function() {
        var game = getGame();
        var players = getPlayers();
        for (var i = 0; i < 2; ++i) {
            var player = players[i];

            emitToPlayers(getPlayersOrderedBy(player.id), 'player data',
            {
                name: player.account.name,
                hats: player.hats,
                character: player.character,
                health: player.health,
                resources: player.resources,
                // friend: player.account.friends.contains(me.account.sbID),
                rating: player.account.rating,
                stats: player.stats,
                attacks: player.attacks
            });
        }
    }

    /**Passes basic game variables to f*/
    var wrapper = function(state, data, f) {
        if (appState[socket.id] !== state) { return; }
        if (appState === GS_PLAYING) {
            if (clientIDtoGameState[socket.id] === undefined) {
                return;
            }
        }
        var game = getGame();
        var players = getPlayers();
        var activePlayer = players[0];
        var passivePlayer = players[1];
        return f(data, game, players, activePlayer, passivePlayer);
    }


    /**Compute and set Base stats*/
    var computeBaseStats = function(unit) {

        unit.stats = CharData.characters[unit.character].stats
        for (var s in unit.stats) {
            for (var i = 0; i < unit.badges.length; ++i) {
                if (s === "maxResources") {
                    for (var j = 0; j < unit.stats[s].length; ++j) {
                        unit.stats[s][j] += unit.badges[s][j][i]
                    }
                }
            }
        }
        unit.health = unit.stats.maxHealth;
        unit.resources = unit.stats.maxResources;
    }


    socket.on('debug', function(data) {
        log('<<<DEBUG>>>')
        log(data);
        log('<<<DEBUG>>>')
    })
    socket.emit('user count', { 'users' : users });
    log('Connection: ' + socket.id);



/********************SHOP FUNCTIONS**************************/
  socket.on('enter store', function(data) {
      //Probably send any important updates to the store data here...
      //mayber even send all available items?
      if (appState[socket.id] !== GS_STARTMENU) {
          return;
      }
      appState[socket.id] = GS_SHOP;
      io.sockets.in(socket.id).emit('enter store');
  });

  socket.on('query store', function(data) {
      if ((appState[socket.id] !== GS_SHOP)  ||
          (! ['character', 'hat'].contains(data.type))) {
          return;
      }
      io.sockets.in(socket.id).emit('query store', shopData[data.type]);
  });

  /**
    data has index (what they want)
    and the type of purchase (character/hat/...)
  */
  socket.on('purchase', function(data) {
      if ((appState[socket.id] !== GS_SHOP) ||
          (! ['character', 'hat'].contains(data.type))) {
          return;
      }
      var cost = shopData[data.type][data.index].cost;
      if (myAccount.gold < cost) {
          data.success = false;
      } else {
          data.success = true;
          myAccount.gold -= cost;
          myAccount[data.type].push(data.index);
          myAccount[data.type].sort();
          myAccount.save();
      }
      io.sockets.in(socket.id).emit('purchase character', data);
  });

/************************************************************/

/****************NOTIFICATIONS*******************************/
socket.on('query notifications', function(data) {
    if (myAccount === null) {
        return;
    }
    socket.emit('query notifications', {notifications : myAccount.notifications});
});

socket.on('delete notification', function(data) {
    if (myAccount === null) { return; }
    var success = data.index < myAccount.noficiations.length;
    if (success) {
        myAccount.notifications.splice(data.index > 0);
    }
    socket.emit('delete notification', { success: success});
});

socket.on('query loadouts', function(data) {
    if (myAccount === null) {
        return;
    }
    io.sockets.in(socket.id).emit('query loadouts', {
        loadOuts: myAccount.loadOuts
    });
})

socket.on('enter editor', function(data) {
    if (myAccount === null || appState[socket.id] !== GS_STARTMENU) {
        log('tried to enter editor from improper place');
        return;
    }
    appState[socket.id] = GS_EDITING;
    io.sockets.in(socket.id).emit('enter editor', {
        hats: myAccount.hats,
        characters: myAccount.characters,
        badges: myAccount.badges,
        loadOuts: myAccount.loadOuts
    });
})

/** Save a load out to the server*/
socket.on('save load out', function(data) {
    if (appState[socket.id] !== GS_EDITING || myAccount === null) {
        socket.emit('err', {errCode: ErrorCode.ILLEGAL_ACTION})
        return;
    }
    if (data.index < 0 || data.index > myAccount.loadOuts.length) {
        myAccount.loadOuts.append(data.loadOut);
    } else {
        myAccount.loadOuts[data.index] = data.loadOut;
    }
    myAccount.save();
    io.sockets.in(socket.id).emit('save load out');
})

/********************ACCOUNT FUNCTIONS***********************/
  //probably want it to actually be unique, but will work on that...
  /** Sets up friends, but this is far from done */
  socket.on('friend', function(data) {
      Account.find({'name': data.name}, function(err, accounts) {
          if (err) {
              log('error finding frinds');
              return;
          }
          for (var i = 0; i < acconts.length; ++i) {
              myAccount.friends.push(accounts[i].sbID);
              accounts[i].friends.push(myAccount.sbID);
              io.sockets.emit('friend', accounts[i].sbID);
          }
      })
  });
  var _validatedEmail;
  /** Before making an account, the email must be validated */
  socket.on('validate email', function(data) {
      if (! (saneString(data.email) &&
             (/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/).test(data.email))) {
          io.sockets.in(socket.id).emit('validate email', {success : false});
          return;
      }
      log('email: ' + data.email);
      Account.count({'privateInfo.email' : data.email}, function(err, count) {
          var success = true;
          if (err) {
              log("Error Counting");
              success = false;
          } else {
             success = (count === 0);
          }
          if (success) {
              _validatedEmail = data.email;
          }
          io.sockets.in(socket.id).emit('validate email', {success : success});
      });
  });
  var _validatedName;
  socket.on('validate name', function (data) {
      log('got a validate name request');
      if (! (saneString(data.name) && ( ! (/\s/g).test(data.name)))) {

          io.sockets.in(socket.id).emit('validate name', {success: false});
          return;
      }
      log('name: ' + data.name);
      Account.count({'name' : data.name}, function(err, count) {
          var success = true;
          if (err) {
              log("Error Counting");
              success = false;
          } else {
             success = (count === 0);
          }
          if (success) {
              _validatedName = data.name;
          }
          io.sockets.in(socket.id).emit('validate name', {success : success});
      });
  });

  /** The client wants to make a new account*/
  socket.on('make account', function makeAccount(data) {
    if (myAccount != null || appState[socket.id] != GS_STARTMENU ||
        data.name !== _validatedName || data.email !== _validatedEmail) {
        log(socket.id + ' tried to make excess accounts.')
        io.sockets.in(socket.id).emit('make account', {success: false});
        return;
    }
    var id = generateUniqueID();

    if (data.name === undefined) {
        data.name = "John Doe"
        data.email = "me@website.com"
    }

    log(data.name);
    Account.count({'sbID' : id}, function(err, count) {
        if (err) {
            log("Error counting!");
            io.sockets.in(socket.id).emit('make account', {success: false})
            return;
        }
        if (count > 0) {
            //try again, made a bad ID
            makeAccount(data);
        } else {
            var account = new Account({
                gold : 0,
                hatData : [],
                characters : [{index: data.characterSelect, level: 1}],
                loadOuts: [{ name : "Starting Load Out",
                              character: data.characterSelect,
                              attacks: [0,1,2],
                              badges : [],
                              hats : [],
                              }],
                name : data.name,
                rating : 1600,
                friends : [],
                sbID :  id,
                notifications : [{subject: 'Welcome', text: 'hi'}],
                privateInfo : {
                    email : data.email,
                    password : 'password',
                    loginTimes : []
                }});
            account.save(function(err) { if (err) { log('error in saving')}});
            io.sockets.in(socket.id).emit('make account', {success : true, sbID: id});
            log('Made Account: ' + id);
            sendMail(data.email, data.name, "Welcome to DG",
            "Hello {name},<br/>Welcome to DG! It is nice to have you on board. We here at Sufferbox Games hope you enjoy our product, if you have any problems or want to get in touch with us for any other reason, please reply to this email.<br/>Have fun,<br/><br/>Sufferbox Games".format({name : data.name}));
        }
  })});

  var recentPings = [];
  var lastPingReceivedTime = currentTime();
  socket.on('ping', function(data) {
      var time = currentTime();
      log('ping');
      recentPings.push(time - lastPingReceivedTime);
      lastPingReceivedTime = time;
      if (recentPings.length > 5) {
          recentPings.shift();
      }
      var averagePing = recentPings.sum() / recentPings.length;
      if (averagePing > 1000) {
          log(socket.id + " has ping " + averagePing);
      }
      io.sockets.in(socket.id).emit('ping', {ping: averagePing});
  });
  /** Logging in. The client sends us
        data:
            sbID
        and we send back
        data:
            name (Account name)
            sbID
            success
 */
  socket.on('login', function(data) {

    if (myAccount != null || appState[socket.id] != GS_STARTMENU) {
        log(socket.id + ' illegally attempted to login')
        io.sockets.in(socket.id).emit('login', {success: false, errorCode: ErrorCode.ILLEGAL_ACTION});
        return;
    }
    Account.find({ 'sbID': data.sbID}, function(e, accounts) {
        if (e) {
            log("Finding account led to error!");
            io.sockets.in(socket.id).emit('login', {success: false, errorCode: ErrorCode.DATABASE_ERROR});
            log('failed login: ' + data.sbID);
            return;
        }
    if (accounts.length > 0) {
        var account = accounts[0];

        account.privateInfo.loginTimes.push((new Date()).getTime())
        myAccount = account;
        data.name = account.name;
        data.gold = account.gold;
        data.friends = account.friends;
        data.notifications = account.notifications;
        data.success = true;
        io.sockets.in(socket.id).emit('login', data);
        log('successful login: ' + data.sbID)
    } else {
        io.sockets.in(socket.id).emit('login', {success: false, errorCode: ErrorCode.ACCOUNT_DOES_NOT_EXIST});
        log('failed login: ' + data.sbID);
    }
  })});

  /** This allows the client to know whether it is out of date or not */
  socket.on("check version", function(data) {
      data.success = data.version !== CharData.version;
      data.version = CharData.version;
      socket.emit("check version", data);
  });

  /** For doing in-app updates of CharData*/
  socket.on("request update", function(data) {
      if (myAccount === null) { return; }
      socket.emit("request update", CharData);
  });

/*****************************************************************/

/*********************STARTING THE GAME***************************/
    /** Begin the game and send information to the users */
    var startGame = function() {
          var game = getGame();
          for (var i = 0; i < 2; ++i) {
              computeBaseStats(game.players[i]);
              /** 2v2 stuff
              for (var j = 0; j < 2; ++j) {
                  computeBaseStats(game.players[i].units[j]);
              }
              */
          }
          sendPlayerData();
          game.currentAction = { active: false };
          log('Began Game: ' + game.id)
          game.begun = true;
    }
  /** The players are ready to start the game, so we need to send them
    * information like who their players are
    */
  socket.on('game ready', function(data) {
    if (appState[socket.id] != GS_JOINING) { return; }
    appState[socket.id] = GS_INTERMEDIARY;
    log('got a ready');
    log(socket.id);
    var game = getGame();
    if (game.ready === 1) {
        startGame();
        game.ready = 0;
        return;
    }
    ++game.ready;
  });

  // The clients have
  socket.on('game loaded', function() {
      wrapper(GS_INTERMEDIARY, {},
          function(empty, game, players) {
      console.log('got a game loaded');
      if (game.ready === 1) {
          log('game loaded')
          for (var i = 0; i < players.length; ++i) {
              appState[players[i].id] = GS_PLAYING;
          }
          emitToPlayers(players, 'game loaded', {})
          game.ready = 0;
          return;
      }
      ++game.ready;
  })})

  var openGameHasId = function(id) {
    for (var i = 0; i < openGames.length; ++i) {
        if (openGames[i].id === id) {
            return true;
        }
    }
    return false;
  }
  var removeById = function(arr, id) {
      for (var i = 0; i < arr.length; ++i) {
          if (arr[i].id === id) {
                arr.splice(i, 1);
                return true;
          }
      }
      return false;
  }
  //state on the socket so that we don't take too long finding a game
  var startedLookingForGameTime = 0;

  /** A player said that they wanted to join a game, but then they changed their mind */
  var cancelFindGame = function() {
      // TODO: Deal with scary case where already got matched to play someone and
      // got cancel.
      if (appState[socket.id] !== GS_JOINING) {
          return false;
      }
      appState[socket.id] = GS_STARTMENU;
      removeById(playersWaitingForGames, socket.id);
      log("Got a Cancellation: Remaining Players Waiting:" + playersWaitingForGames.length)

  }

  /** This function performs matchmaking:
    * When a find game request is sent, we set up a delay so that there will
    * hopefully be a couple of players in the queue when it comes time for
    * matchmaking. Because things could get weird if a player is matched to
    * multiple games, this method is atomic (achieved with a lock)
    */
  var findGameForPlayer = function findGameForPlayer(player) {
        if (clientIDtoGameState[player.id] != undefined) {
            //The player already got matched to a game, there is nothing more to do.
            return;
        }

        if (currentTime() - startedLookingForGameTime > 30000) {
            // :( No one is playing
            // Will actually want to pair with an AI here probably.
            log('timing out matchmaking');
            log('at this point we would match with an AI?')
            cancelFindGame()
            io.sockets.in(socket.id).emit('no opponents');
            appState[socket.id] = GS_STARTMENU
            return;
        }

        if (gameStartingLock !== null || playersWaitingForGames.length <= 1) {
            //Another socket is matching a player right now: that is scary, so lets wait a bit
            //Also wait if there are no other players
            setTimeout( function() { findGameForPlayer(player) }, 10);
            return;
        }


        log('Performing Matchmaking');
        //Ok, let's actually find a game
        gameStartingLock = socket.id;

        var myRating = player.account.rating;
        // Linearly search the waiting players...presumably even if we have
        // a whole lot of users, this wont be too too many

        //lock in fixed search number...if we get too many join requests
        //the loop could otherwise be infinite
        var length = playersWaitingForGames.length;
        var minRatingDifference = Infinity;
        var bestOpponentIndex = 0;
        var myIndex = -1;
        for (var i = 0; i < length; ++i) {
            var p = playersWaitingForGames[i];
            if (p.id === player.id) {
                myIndex = i;
            } else if (Math.abs(p.account.rating - myRating) <= minRatingDifference) {
                minRatingDifference = Math.abs(p.rating - myRating);
                bestOpponentIndex = i;
            }
        }
        if (myIndex < 0) {
            //We aren't here
            gameStartingLock = null;
            return;
        }
        // Remove both self and other player from the wait list
        playersWaitingForGames.splice(myIndex, 1);
        var opponent = playersWaitingForGames.splice(bestOpponentIndex - (myIndex > bestOpponentIndex ? 0 : 1), 1)[0];

        //Make the game already
        var id = generateUniqueID();
        var game = Game(id, player);
        clientIDtoGameState[socket.id] = game;
        game.players[1] = opponent;
        clientIDtoGameState[opponent.id] = game;
        io.sockets.in(opponent.id).emit('join game', {});
        io.sockets.in(socket.id).emit('join game', {});
        gameStartingLock = null;
  }

  socket.on('cancel find game', cancelFindGame);

  /** When we get a find game message, we send the player a find game
    * message, and then add them to the queue for matchmaking
    */
  socket.on('find game', function(data) {
    if ((clientIDtoGameState[socket.id] != undefined)  || appState[socket.id] != GS_STARTMENU) {
        log("Bad find game:")
        log(appState[socket.id])
        log(clientIDtoGameState)
        return;
    }

    data.loadOut |= 0;
    appState[socket.id] = GS_JOINING;
    var player = Player(socket.id, myAccount, myAccount.loadOuts[data.loadOut]);
    playersWaitingForGames.push(player);
    startedLookingForGameTime = currentTime();
    log('sending finding game');
    io.sockets.in(socket.id).emit('find game');
    setTimeout(function() { findGameForPlayer(player) }, 1000);
  });

  /** Resets game state, as per a second game in a match
    * probably not fully updated for current functionality
    * also might not actually be desired
  */
  clearGame = function(game) {
      for (var i = 0; i < game.players.length; ++i) {
          clientIDtoGameState[game.players[i].id] = undefined;
      }
      delete game
  };

/********************************************************************/


/*************************IN GAME FUNCTIONS**************************/


  /** Check to see if the game is over. If it is, then send the game over
    * message as appropriate; otherwise, execute the callback
    */
  var endGameIfOverOrContinue = function(callback) {
      wrapper(GS_PLAYING, {},
          function(empty, game) {
              //Changes for 2v2:
              //_both_ a player's units need to be dead
              var players = getPlayersOrderedBy(game.currentAction.source);
              var dead = [players[0].health <= 0, players[1].health <= 0]
              var gameover = dead[0] || dead[1];
              log(players[0].health)
              log(players[1].health)
              if (dead[0] && dead[1]) {
                  emitToPlayers(players, "game over", {result : "draw"})
              } else if (gameover) {
                  var d = dead[0] ? 0 : 1;
                  console.log(players[d].name + " lost the game");
                  emitToPlayers(getPlayersOrderedBy(players[d].id), "game over", {result : "loss"})
              }
              if (gameover) {
                  log("People Died");
                  for (var i = 0; i < players.length; ++i) {
                      appState[players[i].id] = GS_STARTMENU;
                      clearGame(game);
                  }
                  return;
              }
              return callback()
          })
  }

  /**
   Computes a stat from data about the player (badges/modifiers/etc)
  */
  var computeStat = function(unit, stat) {
      if (stat === "maxResources") {
          var r = unit.stats.maxResources;
          for (var i = 0; i < unit.modifiers.length; ++i) {
              if (unit.modifiers[i].stat === "maxResources") {
                  for (var j = 0; j < unit.modifiers.length; ++j) {
                      r[j] += unit.modifiers[i].amount[j];
                  }
              }
          }
          return r;
      } else {
          var s = unit.stats[stat]
          for (var i = 0; i < unit.modifiers.length; ++i) {
              if (unit.modifiers[i].stat === stat) {
                  s += unit.modifiers[i].amount;
              }
          }
          return s;
      }
  }

  /** At this point, this just checks for the "blocking" status and applies
    * it, presumably, it would be possible for there to be other things
    * that happen here
    */
  var applyDamageModificationEffects = function(attacker, defender, damage) {
      for (var i = 0; i < defender.status.length; ++i) {
          if (defender.status[i].type === "blocking") {
              damage = 0;
              defender.status.splice(i, 1)
              return damage;
          }
      }
      return damage;
  }

  /** All the nitty gritty computations of attacks/effects/etc go here
    */
  var computeAndApplyDamageAndEffects = function(attack, attacker, defender, data) {
      data.effects = []
      var baseDamage  = attack.damage(getGame(), attacker, defender, data.options);

      data.damage = Math.max(0, baseDamage + computeStat(attacker, "attack") - computeStat(defender, "defense"));
      data.damage = applyDamageModificationEffects(attacker, defender, data.damage);
      // Clamp the damage to the opponents health, if necessary.
      data.damage = Math.min(data.damage, defender.health);
      attack.effect(getGame(), attacker, defender, data.options, data.effects);
      log(attacker.name + " dealt " + data.damage + " damage to " + defender.name);
      defender.health -= data.damage;
  }

  /**
    Perform the next action in game.queuedActions: this means remove it from
    the queue, perform all effects/damage/etc associated with it, and
    then propogate this information ot the clients.
    sends
        data
        time :: time at which the action began on the server
        actionID :: a unique id to validate communications
        index :: the index of the action that was performed
        options :: any choices associated with the attack
        damage :: the amount of damage dealt
        effects :: a list of effects caused by the attack
  */
  var performActions = function() {
      wrapper(GS_PLAYING, {},
        function(empty, game) {
            data = {};
           //determine which attack to perform based on speed
            log('Performing actions...');
            if (game.queuedActions.length === 0) {
                log('Attempted to perform too many actions');
                emitToPlayers(game.players, 'err', {errorCode: ErrorCode.ILLEGAL_ACTION})
                return;
            }
            data.time = currentTime();
            data.actionID = generateUniqueID();
            var nextAction = game.queuedActions.pop();;
            var orderedPlayers = getPlayersOrderedBy(nextAction.source);



            game.currentAction = {
                active: true,
                index: nextAction.index,
                id : data.actionID,
                startTime: data.time,
                source: nextAction.source,
                target: nextAction.target
            }

            var attacker = orderedPlayers[0];
            var defender = orderedPlayers[1];

            /**
            2v2  version of code?
            var attacker = orderedPlayers[0].units[game.currentAction.source.unit];
            var defender = orderedPlayers[1].units[game.currentAction.target];
            **/

            var attack =  CharData.characters[attacker.character].attacks[nextAction.index];
            log(attacker.name + ' attacked ' + defender.name + ' with ' + attack.name);

            data.index = nextAction.index;
            data.options = nextAction.options;
            computeAndApplyDamageAndEffects(attack, attacker, defender, data)

            emitToPlayers(orderedPlayers, 'action start', data);
            })
        }
  /**
    data:
        actionID  :: the id that originally came from the server
    The client informs the server that it is done with the current action.
    If all players are done, then we can continue with the simulation.
  */
  socket.on('end action', function(d) {
      wrapper(GS_PLAYING, d,
        function(data, game, players, activePlayer, passivePlayer) {
            log('got an end action from ' + activePlayer.name);
            if (! (game.currentAction.active &&
                   (data.actionID === game.currentAction.id))) {
                       log(activePlayer.name + ' sent a bad end action')
                       log(data.actionID === game.currentAction.id)
                       log(game.currentAction.active)
                       log("------------------------------------------------------------")
                       socket.emit('err', {errorCode: ErrorCode.ILLEGAL_ACTION})
                       return;
                   }
            ++game.ready;
            emitToPlayers(players, 'end action', data);
            if (game.ready === 2) {
                endGameIfOverOrContinue(function() {
                if (game.queuedActions.length > 0) {
                    console.log("Sending a new attack");
                    game.ready = 0;
                    game.currentAction.active = false;
                    performActions();

                } else {
                    game.currentAction.active = false;
                    emitToPlayers(players, 'all actions done', {})
                    game.ready = 0;
                } })
            }
      })
  });

  /** Input data:
        index  -- the index of the attack used
      Output data:
        index
        time   -- the time at which the attack message is sent
        actionID -- a unique id, used to make sure that attack messages don't cross-contaminate
    */


socket.on('submit action', function(d) {
    wrapper(GS_PLAYING, numberify(d, ['index']),
      function(data, game, players, activePlayer, passivePlayer) {
          if (! ((! game.currentAction.active) &&
                  verifyIsLegalAttack(data))) {
                      socket.emit('err', {errorCode: ErrorCode.ILLEGAL_ACTION});
                      return;
                  }
          log(activePlayer.account.name + ' submitted an action')
          log(data);
          game.queuedActions.push({
              options: data.options,
              index: data.index,
              source: socket.id,
              //source: {id: socket.id, unit: data.sourceUnit},
              target: data.target,
              speed: CharData.characters[activePlayer./**units[data.sourceUnit.*/character].attacks[data.index].speed(game, players)
          });
          emitToPlayers(players, 'submit action', data);
          log('speed: ' + game.queuedActions[game.queuedActions.length - 1].speed)
          if (game.queuedActions.length === 2) {
              game.queuedActions.sort(function(x, y) { return x.speed - y.speed;})
              performActions();
          }
      });
})

  socket.on('concede', function() {
    wrapper(GS_PLAYING, 0,
        function(d, game, players) {
    emitToPlayers(players, 'concede', {});
    for (var i = 0; i < players.length; ++i) {
        appState[players[i]] = GS_JOINING;
    }
    log("concession");
  })});

/**********************************************************/

  socket.on('disconnect', function() {
    log('Client Disconnected: ' + socket.id);
    --users
    if (myAccount != null) {
        myAccount.save(function (e) { if (e) { log("error when saving")}})
    }
    var game = getGame();
    if (game != null) {
        if (game.begun) {
            io.sockets.in(getPlayers()[1].id).emit('opponent disconnected');
        } else {
           log('deleted open game')
           openGames.remove(game);
        }
        delete game;
    }
  });
})};
