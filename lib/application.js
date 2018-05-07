const IO = require('socket.io');
const debug = require('debug')('trpg:application');
const debugSocket = require('debug')('trpg:socket');
const schedule = require('node-schedule');
const fs = require('fs-extra');
const path = require('path');
const Storage = require('./storage');
const WebService = require('./webservice');
const logger = require('./logger')();
const errorLogger = require('./logger')('error');

let app = exports = module.exports = {};
app.engines = {};
app.settings = {};// 设置配置列表
app.io = null;// websocket服务
app.storage = null;// 数据库服务列表
app.webservice = null;// 网页服务
app.components = [];// 组件列表
app.events = {};// 内部事件列表
app.socketEvents = [];// socket响应列表
app.timers = [];// 计时器列表
app.webApi = {};// 网页服务api
app.statInfoJob = [];// 统计信息任务

app.run = function run() {
  // TODO 启动检测，如果为第一次启动则初始化。如果非第一次启动则重新开启（保留之前配置）
  this.init();
}

app.init = function init() {
  this.defaultConfiguration();
  this.initWebService();
  this.initIO();
  this.initIOEvent();
  this.initStorage();
  this.initStatJob();
  this.initComponents();

  debug('init completed!');
  this.emit('initCompleted', this);
  this.webservice.listen();
}

app.defaultConfiguration = function defaultConfiguration() {
  let env = process.env.NODE_ENV || 'development';
  let port = process.env.PORT || '23256';
  let verbose = false;
  if(process.env.VERBOSE && process.env.VERBOSE.toLowerCase() === 'true') {
    verbose = true;
  }

  this.setDefault('env', env);
  this.setDefault('port', port);
  this.setDefault('verbose', verbose);
  this.setDefault('webserviceHomepage', '');
}

app.initWebService = function initWebService() {
  try {
    let port = Number(this.set('port'));
    this.webservice = new WebService({
      port,
      webApi: this.webApi,
      homepage: this.get('webserviceHomepage'),
    });
    this.webservice.context.trpgapp = this;
    debug("create webservice(%d) success!", port);
  }catch(err) {
    console.error("create webservice error:");
    throw err;
  }
}

app.initIO = function initIO() {
  try {
    let port = Number(this.set('port'));
    let opts = {
      pingInterval: 20000,// default: 25000
      pingTimeout: 40000,// default: 60000
    }
    if(this.webservice) {
      debug('start a http socket.io server');
      this.io = IO(this.webservice.getHttpServer(), opts);
    }else {
      debug('start a independent socket.io server');
      this.io = IO(port, opts);
    }
    debug("create io(%d) process success!", port);
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
      debug('socket%s disconnect: %o', app.get('verbose') ? `[${socket.id}]` : '' , data);
      app.emit('disconnect', socket);
    });
    socket.on('hello', function(data, cb) {
      var res = {data, version: '0.0.1'};
      cb(res);
    })

    app.emit('connection', socket);
    // 注册事件
    let wrap = {app, socket};
    for (let event of app.socketEvents) {
      let eventName = event.name;
      socket.on(eventName, (data, cb) => {
        let socketId = wrap.socket.id;
        let verbose = app.get('verbose');
        data = JSON.parse(JSON.stringify(data));
        if(verbose) {
          debugSocket("[%s]%s <-- %o", socketId, eventName, data);
        }else {
          debugSocket("%s <-- %o", eventName, data);
        }
        logger.info(eventName, '<--', data);

        event.fn.call(wrap, data, function(res) {
          cb(res);
          res = JSON.parse(JSON.stringify(res));
          if(verbose) {
            debugSocket("[%s]%s --> %o", socketId, eventName, res);
          }else {
            debugSocket("%s --> %o", eventName, res);
          }

          if(res.result === false) {
            logger.error(eventName, '-->', res);
            errorLogger.error(eventName, '-->', res)
          }else {
            logger.info(eventName, '-->', res);
          }
        })
      });
    }
  });
  debug('bind io event success!');
}
app.initStorage = function initStorage() {
  let opts = {}
  if(app.get('storageUrl')) {
    let url = app.get('storageUrl');
    if(url.indexOf('sqlite://') === 0) {
      opts.type = 'file';
    }else {
      opts.type = 'sql';
    }
    opts.url = url;
  }
  this.storage = new Storage(opts);
}
app.initStatJob = function initStatJob() {
  let run = async () => {
    try {
      debug('start statistics project info...');
      let info = {};
      for (let job of this.statInfoJob) {
        let name = job.name;
        let fn = job.fn;
        let res = await fn();
        debug('|- [%s]:%o', name, res);
        info[name] = res;
      }
      info._updated = new Date().getTime();
      await fs.writeJson(path.resolve(process.cwd(), './stat.json'), info, {spaces: 2});
      debug('statistics completed!');
    }catch(e) {
      console.error('statistics error:', e);
    }
  }

  // 每天凌晨2点统计一遍
  schedule.scheduleJob('0 0 2 * * *', run);
  // schedule.scheduleJob('1 * * * * *', run); // just for test
}

app.initComponents = function initComponents() {
  for (component of this.components) {
    try {
      debug('initing ...%o', component);
      component.call(this, this);
    }catch(e) {
      console.warn('component init error:', e);
    }
  }
}

// eventFn is async/await fn
app.register = function(appEventName, eventFn) {
  if(!!this.events[appEventName]) {
    this.events[appEventName].push(eventFn);
  }else {
    this.events[appEventName] = [eventFn];
  }
}

app.registerEvent = function(eventName, eventFn) {
  let index = this.socketEvents.findIndex((e) => {
    return e.name === eventName;
  })
  if(index >= 0) {
    debug('register socket event [%s] duplicated', eventName);
    return;
  }
  debug('register socket event [%s]', eventName);
  this.socketEvents.push({
    name: eventName,
    fn: async function (data, cb) {
      let app = this.app;
      let db;
      try {
        db = await app.storage.connectAsync();
        let ret = await eventFn.call(this, data, cb, db);
        if(ret !== undefined) {
          // return 方法返回结果信息
          if(typeof ret === 'object') {
            if(!ret.result) {
              ret.result = true;
            }

            cb(ret);
          }else {
            cb({result: true, data: ret})
          }
        }
      }catch(err) {
        // 若event.fn内没有进行异常处理，进行统一的异常处理
        if(cb && typeof cb === 'function') {
          cb({result: false, msg: err.toString()});
          console.error(err);
        }else {
          debug('unhandled error msg return on %s, received %o', event.name, data);
        }
      }finally{
        db && db.close();
      }
    }
  });
}

app.registerTimer = function(fn, millisec, loop) {
  var indexNum = 0;
  let timer = setInterval(function() {
    fn();
    indexNum++;
    if(!!loop && loop >= indexNum) {
      clearInterval(timer)
    }
  }, millisec);

  this.timers.push(timer);
}

app.registerWebApi = function(path, fn) {
  this.webApi[path] = fn;
}

app.registerStatJob = function(statName, statCb) {
  for (let s of this.statInfoJob) {
    if(s.name === statName) {
      debug(`stat info [${statName}] has been registered`);
      return;
    }
  }

  debug('register stat job [%s]', statName);
  this.statInfoJob.push({
    name: statName,
    fn: statCb,
  });
}

app.close = function(cb) {
  this.io.close(cb);
  // 清理timer
  for (let timer of this.timers) {
    clearInterval(timer)
  }
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

app.setDefault = function setDefault(setting, val) {
  if(!this.settings[setting]) {
    debug('set "%s" to %o by default', setting, val)
    this.settings[setting] = val;
  }
  return this;
}

app.get = function get(setting) {
  return this.settings[setting] || '';
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
    storage.resetAsync(async function(db) {
      try {
        if(!!app.events['resetStorage']) {
          for (let fn of app.events['resetStorage']) {
            await fn(storage, db);
          }
        }
        app.emit('resetStorage', storage, db);
        debug('base storage has completed!');
      }catch(err) {
        console.error("reset storage error", err);
        throw err;
      }finally{
        db.close();
      }
    });
  }
}
