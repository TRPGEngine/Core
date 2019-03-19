const _ = require('lodash');

module.exports = IOSessionMiddleware;

function IOSessionMiddleware(app, opt) {
  const store = opt.store;
  const key = opt.key || 'koa:sess';

  return async function(socket, next) {
    if (!socket.handshake.headers.cookie) {
      return next(new Error('no cookie'));
    }
    if(socket.websession) {
      return next();
    }

    let ctx = app.createContext(socket.request, socket.response);
    let sid = ctx.cookies.get(key, opt); // web的cookie对应的session id。如果只访问socket服务而没访问过web服务的话返回的是undefined

    socket.iosession = new IOSessionContext(`io:${socket.id}`, store);
    socket.websession = new IOSessionContext(`web:${sid}`, store);

    return next()
  }
}

function IOSessionContext(sid, store) {
  this.sid = sid;
  this.store = store;
}

IOSessionContext.prototype.get = async function(path) {
  const session = await this.store.get(this.sid);
  if(path && typeof path === 'string') {
    return _.get(session, path)
  }

  return session;
}

IOSessionContext.prototype.set = async function(path = '', value) {
  const session = await this.store.get(this.sid);
  _.set(session, path, value);
  await this.store.set(this.sid, session);
  return session;
}

IOSessionContext.prototype.destroy = function() {
  return this.store.destroy(this.sid);
}
