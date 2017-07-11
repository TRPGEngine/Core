module.exports = Player;

function Player(socket, info) {
  if(!socket) {
    throw new Error('socket is required');
  }

  this.socket = socket;
  this.info = info || {};
}

Player.prototype.setInfo(info) {
  if(typeof info !== 'object') {
    throw new Error(`info parameter must be a object. not ${typeof info}`);
  }

  this.info = Object.assign({}, this.info, info);
}

Player.prototype.getName() {
  return this.info.playerName || "";
}

Player.prototype.getUUID() {
  return this.info.uuid || "";
}
