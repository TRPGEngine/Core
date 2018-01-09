const http = require('http');
const Koa = require('koa');
const cors = require('koa-cors');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const Router = require('koa-router');
const debug = require('debug')('trpg:webservice');
const koaDebug = require('debug')('trpg:webservice:koa');

module.exports = WebService;

function WebService(opts) {
  if (!(this instanceof WebService)) return new WebService(opts);
  this._app = new Koa();
  this._server = http.createServer(this._app.callback());
  this.webApi = {};
  this.homepage = '';
  this.port = 3000;
  this.context = this._app.context;

  initConfig.call(this, opts);
  initMiddleware.call(this);
  initRoute.call(this);
}

function initConfig(opts) {
  if(opts && opts.port && typeof opts.port === 'number') {
    this.port = opts.port;
  }
  if(opts && opts.webApi && typeof opts.webApi === 'object') {
    this.webApi = opts.webApi;
  }
  if(opts && opts.homepage && typeof opts.homepage === 'string') {
    this.homepage = opts.homepage;
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

function initRoute() {
  let router = new Router();
  // homepage
  if(!!this.homepage) {
    router.get('/', (ctx) => {
      ctx.redirect(this.homepage);
    });
    debug('set webserver homepage to:' + this.homepage);
  }

  // api
  for (var apiPath in this.webApi) {
    let path = apiPath;
    if(apiPath[0] !== '/') {
      path = '/' + apiPath;
    }

    router.get('/api'+path, this.webApi[apiPath]);
    debug('register web api [%s] success!', apiPath);
  }
  this.use(router.routes()).use(router.allowedMethods());
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
  return this;
}
