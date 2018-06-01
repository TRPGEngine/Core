const orm = require('orm');
const transaction = require('orm-transaction');
const path = require('path');
const fs = require('fs');
const process = require('process');
const debug = require('debug')('trpg:storage');
const appLogger = require('./logger')('application');

module.exports = Storage;

function Storage(opts) {
  if (!(this instanceof Storage)) return new Storage(opts);

  this._orm = orm;
  this.models = [];
  this.type = opts.type || 'file';// or sql
  this.dirverUrl = opts.url || "sqlite://" + path.resolve(process.cwd(), './db/database.db?timezone=+08:00');
}

Storage.prototype.test = function() {
  var db = orm.connect(this.dirverUrl, function(err, db) {
    if (err) throw new Error('Connection error: ' + err);

    debug("test log db: %O", db);
  });
}
Storage.prototype.getModels = function(db, cb) {
  try {
    db.settings.set('instance.returnAllErrors', true);
    db.use(transaction);

    for (model of this.models) {
      model(orm, db);
    }

    // cb(null, db);
    return db;
  } catch (e) {
    // cb(e);
    throw new Error(e);
  }
}
Storage.prototype.connect = function(cb) {
  let storage = this;
  orm.connect(storage.dirverUrl, function(err, db) {
    if (err) throw new Error('Connection error: ' + err);

    cb(storage.getModels(db));
  });
}
Storage.prototype.connectAsync = async function() {
  let storage = this;
  let db;
  try {
    db = await orm.connectAsync(storage.dirverUrl);
    db = storage.getModels(db);
  }catch(e) {
    throw new Error(e);
  }

  return db;
}
Storage.prototype.registerModel = function(model) {
  if(typeof model != 'function') {
    throw new TypeError(`registerModel error: type of model must be Function not ${typeof model}`);
  }

  debug('register model %o success!', model);
  appLogger.info('register model %o success!', model);
  this.models.push(model);
}

Storage.prototype.reset = function(cb) {
  if(this.type === 'file') {
    let filepath = path.resolve(process.cwd(), './db/');
    // 创建文件夹
    let dbDirExists = fs.existsSync(filepath);
    if(!dbDirExists) {
      fs.mkdirSync(filepath);
    }
  }

  this.connect(function(db) {
    db.drop(function(err) {
      if (err) throw err;

      db.sync(function (err) {
        if (err) throw err;

        cb(db);
      });
    });
  })
}

Storage.prototype.resetAsync = async function(cb) {
  if(this.type === 'file') {
    let filepath = path.resolve(process.cwd(), './db/');
    // 创建文件夹
    let dbDirExists = fs.existsSync(filepath);
    if(!dbDirExists) {
      fs.mkdirSync(filepath);
    }
  }

  try {
    const db = await this.connectAsync();
    console.log('is dropping db...');
    await db.dropAsync();
    console.log('is recreate db...');
    await db.syncPromise();
    console.log('start reset module db...');
    await cb(db);
    console.log('reset completed!');
  } catch(err) {
    console.error('reset error:');
    console.error(err);
    process.exit(1);
  }
}

/*
db.driver.execQuery("SELECT id, email FROM user", function (err, data) { ... })
// 上面是直接执行SQL，下面是类似参数化。   列用??表示, 列值用?表示。   建议使用下面这种
db.driver.execQuery(
  "SELECT user.??, user.?? FROM user WHERE user.?? LIKE ? AND user.?? > ?",
  ['id', 'name', 'name', 'john', 'id', 55],
  function (err, data) { ... }
)
*/
Storage.prototype.query = function(sql, params, cb) {
  this.connect(function(db) {
    db.driver.execQuery(sql, params, cb);
  });
}
