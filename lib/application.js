const io = require('socket.io');
const debug = require('debug')('trpg:application');

let app = exports = module.exports = {};

app.init = function init() {
  this.engines = {};
  this.settings = {};
  this.io = {};

  this.defaultConfiguration();
  this.initIO();
}

app.defaultConfiguration = function defaultConfiguration() {
  let env = process.env.NODE_ENV || 'development';
  let port = process.env.PORT || '23256';

  this.set('env', env);
  this.set('port', port);
}

app.initIO = function() {
  try {
    port = Number(this.set('port'));
    this.io = io(port);
    debug("create io(%s) process success!", port);
  } catch(err) {
    debug("create io process error: %O", err);
    throw err;
  } finally {
    return this;
  }
}

app.close = function(cb) {
  this.io.close(cb);
}

app.set = function set(setting, val) {
  if(arguments.length === 1) {
    return this.settings[setting];
  }

  debug('set "%s" to %o', setting, val);

  this.settings[setting] = val;

  return this;
}

app.get = function get(setting) {
  return this.settings[setting];
}

app.enabled = function enabled(setting) {
  return Boolean(this.set(setting));
}

app.disabled = function disabled(setting) {
  return !this.set(setting);
};

app.enable = function enable(setting) {
  return this.set(setting, true);
};

app.disable = function disable(setting) {
  return this.set(setting, false);
};

app.onconnect = function onconnect(cb) {
  if(cb) {
    throw new TypeError(`param must be a Function. this is a ${typeof cb}`);
  }

  if(this.io) {
    throw new Error('io is not initialized');
  }

  this.io.on('connection', cb);
}
