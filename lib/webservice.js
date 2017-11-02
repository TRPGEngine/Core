const http = require('http');
const Koa = require('koa');
const cors = require('koa-cors');
const logger = require('koa-logger');
const debug = require('debug')('trpg:webservice');

module.exports = WebService;

function WebService(opts) {
  if (!(this instanceof WebService)) return new WebService(opts);
  this._app = new Koa();
  this._server = http.createServer(this._app.callback());
  this.middleware = [];
  this.port = 3000;

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

  this.use(async ctx => {
    ctx.body = 'Hello World';
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
