DuelGame
===

(c) 2015 Sam Donow <<sad3@williams.edu>>, Nigel Munoz <<a href="http://nigelmnz.com">nigelmnz.com</a>>

DuelGame is the skeletal structure for a 2-player, turn-based, cross-platform, role-playing game.

The client side is written in Unity utilizing <a href="https://github.com/fpanettieri/unity-socket.io">unity-socket.io</a>, and requires either the proprietary Good Ol' Sockets package or Unity Pro.

The server side is written with node.js, with a number of open libraries from npm (http, fs, mongoose, emailsender, mongoose, sanitize-html, emailjs). As well as socket.io for sockets and Mongoose and MongoDB for databases.

To run the code, simply set up a node environment with all of the above packages installed, and then run the standardNodeServer.js file from node. On the client side, just open the project in Unity and then run the program. Obviously you will need a machine to act as the server in order to do this, and you will have to put the address of the server in the requisite place of the server code.
