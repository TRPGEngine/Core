module.exports = function(orm, db) {
  var Actor = db.define('core_actor', {
    uuid: {type: 'text', required: true},
    name: {type: 'text', required: true}
  }, {
    methods: {

    }
  });
  Actor.hasOne('user');

  return Actor;
}
