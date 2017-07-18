const orm = require('orm');
const path = require('path');
const process = require('process');
const md5 = require('./md5');
const uuid = require('uuid/v1');
const models = require('./models/');
const debug = require('debug')('trpg:storage');

module.exports = Storage;

function Storage() {
  if (!(this instanceof Storage)) return new Storage();

  this.driver = 'sqlite';
  this.dbname = 'datebase';
  this.path = this.driver + '://' +  path.resolve(process.cwd(), './db/'+this.dbname+'.db');
  this.models = [];
}

Storage.prototype.test = function() {
  var db = orm.connect(this.path, function(err, db) {
    if (err) throw new Error('Connection error: ' + err);

    console.log(db);
  });
}

Storage.prototype.connect = function(cb) {
  let storage = this;
  orm.connect(storage.path, function(err, db) {
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
