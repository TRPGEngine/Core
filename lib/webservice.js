const http = require('http');
const Koa = require('koa');
const cors = require('koa-cors');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const debug = require('debug')('trpg:webservice');
const koaDebug = require('debug')('trpg:webservice:koa');

module.exports = WebService;

function WebService(opts) {
  if (!(this instanceof WebService)) return new WebService(opts);
  this._app = new Koa();
  this._server = http.createServer(this._app.callback());
  this.middleware = [];
  this.port = 3000;
  this.context = this._app.context;

  initConfig.call(this, opts);
  initMiddleware.call(this);
}

function initConfig(opts) {
  if(opts && opts.port && typeof opts.port === 'number') {
    this.port = opts.port;
  }
}

function initMiddleware() {
  this._app.keys = ['trpg'];
  this.use(logger((str) => {
    koaDebug(str.trim());
  }));
  this.use(cors());
  this.use(bodyParser());
  this.use(session({
    key: 'koa:sess',
    maxAge: 86400000,// 24小时
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false,
  }, this._app))

  this.use(async (ctx, next) => {
    try {
      await next();
      if(!ctx.body) {
        ctx.status = 404;
        ctx.body = {
          result: false,
          msg: 'Not found',
        }
      }
    }catch(e) {
      console.error('[WebService]', e);
      ctx.status = 500;
      ctx.body = {
        result: false,
        msg: e.toString(),
      }
    }
  });
}

WebService.prototype.listen = function() {
  debug('start to listen(%d)', this.port);
  return this.getHttpServer().listen(this.port, () => {
    console.log('listening on *:'+this.port);
  });
}

WebService.prototype.getHttpServer = function() {
  return this._server;
}

WebService.prototype.use = function(...args) {
  this._app.use(...args);
}
