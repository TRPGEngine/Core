module.exports = Player;

function Player(socket, info) {
  if(!socket) {
    throw new Error('socket is required');
  }

  this.socket = socket;
  this.info = info;
}
