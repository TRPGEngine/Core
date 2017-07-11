const io = require('socket.io');
const Player = require('./lib/player');
const DB = require('./lib/db');

module.exports = Server;

function Server(options) {
  if (!(this instanceof Server)) return new Server(options);
  try {
    options = options || {}
    this.httpserver = options.httpserver || null;
    this.port = options.port || 23256;
    this.io = io(this.httpserver || this.port);
    this.serverName = options.serverName || "TRPG";
    this.listener = [];
    this.playerList = [];
    this.db = DB();

    this.initEventListener();

    console.log('websocket server has been listen port ' + this.port);
  }catch(err) {
    throw new Error(err);
  }
}

// 事件监听器
Server.prototype.initEventListener = function() {
  console.log("初始化WS事件监听器");
  this.io.on('connection', (socket) => {
    this.playerList.push(new Player(socket, {}));
    console.log("用户登录成功, 当前人数:" + this.getPlayerCount());

    socket.on('login', (info, fn) => {
      let player = this.getPlayer(socket);
      player.setInfo(info);
      fn();
    })

    socket.on('message', (data) => {
      console.log(data);
    });

    socket.on('chat', (msg) => {
      console.log(msg);
      this.io.emit('chat', msg);
    });

    socket.on('disconnect', () => {
      // TODO 保存用户信息
      this.removePlayer(socket);
      console.log("用户已离线, 当前人数:" + this.getPlayerCount());
    });

    for (listen of this.listener) {
      socket.on(listen.name, listen.fn);
    }
  });
}
// fn(socket)
Server.prototype.addEventListener = function(name, fn) {
  let _listener = {name, fn};
  this.listener.push(_listener);
}

// 玩家列表管理
Server.prototype.getPlayerCount = function() {
  return this.playerList.length;
}
Server.prototype.getPlayer = function(socket) {
  let list = this.playerList;
  for (player of list) {
    if(player.socket === socket) {
      return player;
    }
  }
  return false;
}
Server.prototype.removePlayer = function(socket) {
  let player = this.getPlayer(socket);
  let index = this.playerList.indexOf(player);
  if(index > -1) {
    this.playerList.splice(index,1);
  }
}
