const EventEmitter = require('events').EventEmitter;
const mixin = require('merge-descriptors');
const proto = require('./application');
const debug = require('debug')('trpg:core');

exports = module.exports = createApplication;

function createApplication() {
  let app = {};

  mixin(app, EventEmitter.prototype, false);
  mixin(app, proto, false);

  // app.init();
  initIOEvent.call(app);
  return app;
}

function initIOEvent() {
  let app = this;
  app.io.on('connection', function(socket) {
    debug('a connect is created');
    app.emit('connection', socket);

    socket.on('message', function(data, cb) {
      app.emit('message', data, cb);
    });

    socket.on('disconnect', function(data, cb) {
      debug('socket disconnect: %o', data);
      app.emit('disconnect', socket);
    });
  });
  debug('bind io event success!');
}
