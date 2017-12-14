const http = require('http');
const Koa = require('koa');
const cors = require('koa-cors');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const debug = require('debug')('trpg:webservice');

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
  this.use(logger());
  this.use(cors());
  this.use(bodyParser());

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
      console.error(e);
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
