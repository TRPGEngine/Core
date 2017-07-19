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
  return app;
}
