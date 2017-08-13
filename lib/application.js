const io = require('socket.io');
const debug = require('debug')('trpg:application');
const Storage = require('./storage');

let app = exports = module.exports = {};
app.engines = {};
app.settings = {};
app.io = {};
app.storage = {};
app.components = [];

app.run = function run() {
  // TODO 启动检测，如果为第一次启动则初始化。如果非第一次启动则重新开启（保留之前配置）
  this.init();
}

app.init = function init() {
  this.defaultConfiguration();
  this.initIO();
  this.initIOEvent();
  this.initStorage();
  this.initComponents();

  this.emit('initCompleted', this);
}

app.defaultConfiguration = function defaultConfiguration() {
  let env = process.env.NODE_ENV || 'development';
  let port = process.env.PORT || '23256';

  this.set('env', env);
  this.set('port', port);
}

app.initIO = function initIO() {
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
app.initIOEvent = function initIOEvent() {
  let app = this;
  app.io.on('connection', function(socket) {
    debug('a connect is created');

    socket.on('message', function(data, cb) {
      app.emit('message', data, cb);
    });

    socket.on('disconnect', function(data, cb) {
      debug('socket disconnect: %o', data);
      app.emit('disconnect', socket);
    });
    socket.on('hello', function(data, cb) {
      var res = {data, version: '0.0.1'};
      cb(res);
    })

    app.emit('connection', socket);
  });
  debug('bind io event success!');
}
app.initStorage = function initStorage() {
  this.storage = new Storage();
}

app.initComponents = function initComponents() {
  for (component of this.components) {
    try {
      component.call(this, this);
    }catch(e) {
      console.warn('component init error:' + e);
    }
  }
}

app.close = function(cb) {
  this.io.close(cb);
  this.emit('close');
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

app.load = function load(component) {
  let app = this;
  if(!!component && typeof component === 'function') {
    this.components.push(component);
    debug('load component into comments list(length: %d). %o', this.components.length, component);
  }else {
    debug(`component must be a Function not a ${typeof component}`);
    throw new Error('Component load failed. Component must be a Function.');
  }
}

app.reset = function reset() {
  let app = this;
  let storage = this.storage;
  if(storage) {
    debug('start resetStorage');
    storage.reset(function(db) {
      app.emit('resetStorage', storage, db);
      debug('base storage has completed!');
    });
  }
}
