const orm = require('orm');

function setup(db, cb) {
  let User = require('./user')(orm, db);

  return cb(null, db);
}

module.exports = function (db, cb) {
  db.settings.set('instance.returnAllErrors', true);
  setup(db, cb);
};
