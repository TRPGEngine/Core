const orm = require('orm');
const path = require('path');
const process = require('process');
const md5 = require('./md5');
const uuid = require('uuid/v1');
const models = require('./models/');

module.exports = DB;

function DB() {
  if (!(this instanceof DB)) return new DB();

  this.driver = 'sqlite';
  this.dbname = 'datebase';
  this.path = this.driver + '://' +  path.resolve(process.cwd(), './db/'+this.dbname+'.db');
  this.models = {}; // models Function with (orm, db)
}

DB.prototype.test = function() {
  var db = orm.connect(this.path, function(err, db) {
    if (err) return console.error('Connection error: ' + err);

    console.log(db);
  });
}
DB.prototype.connect = function(cb) {
  orm.connect(this.path, function(err, db) {
    if (err) return console.error('Connection error: ' + err);

    models(db, function(err, db) {
      if (err) throw err;

      cb(db);
    });
  });
}
DB.prototype.init = function(db, cb) {
  db.models.core_user.create({
    username: 'admin',
    password: md5('admin'),
    uuid: uuid()
  }, function(err, res) {
    if (err) throw err;

    if(cb) {
      cb();
    }
  });
}
