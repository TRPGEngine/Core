module.exports = function(orm, db) {
  return db.define('core_user', {
    username: {type: 'text', required: true},
    password: {type: 'text', required: true},
    uuid: {type: 'text', required: true},
    last_login: {type: 'text'},
    selected_actor: {type: 'text'}
  }, {
    methods: {

    }
  });
}
