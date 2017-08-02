const orm = require('orm');
const path = require('path');
const fs = require('fs');
const process = require('process');
const debug = require('debug')('trpg:storage');

module.exports = Storage;

function Storage() {
  if (!(this instanceof Storage)) return new Storage();

  this.models = [];
  this.type = 'file';// or sql
  this.dirverUrl = "sqlite://" + path.resolve(process.cwd(), './db/database.db');
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

    for (model of this.models) {
      model(orm, db);
    }

    cb(null, db);
  } catch (e) {
    cb(e);
  }
}
Storage.prototype.connect = function(cb) {
  let storage = this;
  orm.connect(storage.dirverUrl, function(err, db) {
    if (err) throw new Error('Connection error: ' + err);

    storage.getModels(db, function(err, db) {
      if (err) throw err;

      cb(db);
    });
  });
}
Storage.prototype.registerModel = function(model) {
  if(typeof model != 'function') {
    throw new TypeError(`registerModel error: type of model must be Function not ${typeof model}`);
  }

  debug('register model %o success!', model);
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
