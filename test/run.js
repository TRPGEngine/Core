let core = require('../index')();

core.db.connect(function(db) {
  db.models.core_user.get(1, function(err, user) {
    if (err) throw err;

    console.log(user.uuid);
  });
  core.io.close();
});
