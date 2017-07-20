const orm = require('orm');
const path = require('path');
const process = require('process');
const debug = require('debug')('trpg:storage');

module.exports = Storage;

function Storage() {
  if (!(this instanceof Storage)) return new Storage();

  this.models = [];
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
    cb(err);
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
