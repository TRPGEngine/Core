const EventEmitter = require('events').EventEmitter;
const mixin = require('merge-descriptors');
const proto = require('./application');
const debug = require('debug')('trpg:core');

exports = module.exports = createApplication;

function createApplication(conf) {
  let app = {};

  mixin(app, EventEmitter.prototype, false);
  mixin(app, proto, false);

  setConfig(app, conf);

  // app.init();
  return app;
}

function setConfig(app, conf) {
  if(!conf) {
    return;
  }

  if(conf.storageUrl) {
    app.set('storageUrl', conf.storageUrl);
  }
}
