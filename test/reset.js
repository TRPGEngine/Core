let core = require('../index')();

core.db.connect(function(db) {
  db.drop(function(err) {
    if (err) throw err;

    db.sync(function (err) {
      if (err) throw err;

      core.db.init(db, function() {
        core.io.close();
      });
    });
  });
})
