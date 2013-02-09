var express = require('express');
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(80);

app.use(express.static(__dirname + '/'));

app.get('/', function (req, res){
  res.sendfile(__dirname + '/home.html');
});

io.sockets.on('connection', function (socket) {

  socket.on('setName', function (username) {
    socket.set('username', username, function() {
      socket.emit('usernameIsSet');
    });
  });

  socket.on('createRoom', function() {
    var timestamp = new Date().getTime();
    socket.set('roomName', timestamp, function () {
      socket.join(timestamp);
      socket.get('username', function (err, name) {
        io.sockets.in(timestamp).emit('new_join', {username: name, roomName: timestamp});
      });
    });
  });

  socket.on('joinRoom', function (roomName) {
    var l = io.sockets.clients(roomName).length;
    if(l < 2) {
      socket.set('roomName', roomName, function () {
        socket.join(roomName);
        socket.get('username', function (err, name) {
          io.sockets.in(roomName).emit('new_join', {username: name, roomName: roomName});
        });
      });
    } else {
      socket.emit('too_many');
    }
  });

  socket.on('sendMessage', function(data) {
    socket.get('roomName', function (err, name) {
      socket.get('username', function (err, name2) {
        io.sockets.in(name).emit('newMessage', {username: name2, message: data.message,language: data.language});
      });
    });
  });

});
