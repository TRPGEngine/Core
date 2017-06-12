const io = require('socket.io');

module.exports = Server;

function Server(options) {
  if (!(this instanceof Server)) return new Server(options);
  try {
    options = options || {}
    this.port = options.port || 23256;
    this.io = io(this.port);
    this.serverName = options.serverName || "TRPG";
    this.listener = {};

    this.initEventListener();

    console.log('websocket server has been listen port ' + this.port);
  }catch(err) {
    throw new Error(err);
  }
}

Server.prototype.initEventListener = function() {
  this.io.on('ping', function(socket) {
    socket.emit('pong');
  })

  let player = this.listener.player = this.io
    .of('/player')
    .on('login', function(socket) {
      console.log(socket);
      socket.emit('login', {
        timestamp: new Date()
      })
      player.emit('login', {
        timestamp: new Date()
      })
    })
    .on('logout', function(socket) {
      console.log(socket);
      player.emit('logout', {
        timestamp: new Date()
      })
    });

  let lobby = this.listener.player = this.io
    .of('/lobby')
    .on('chat', function(socket) {
      lobby.emit('chat', {
        timestamp: new Date()
      })
    })
}
