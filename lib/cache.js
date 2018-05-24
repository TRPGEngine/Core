const util = require('util');
const Redis = require('ioredis');
const debug = require('debug')('trpg:cache');

function Cache(opts) {
  this.data = {};
}
Cache.prototype.set = function(key, value) {
  debug('[cache]', `set ${key} to ${JSON.stringify(value)}`);
  this.data[key] = value;
  return value;
}
Cache.prototype.get = function(key) {
  return this.data[key];
}
Cache.prototype.close = function() {
  debug('start closing cache');
  this.data = {};
}

function RedisCache(opts) {
  this.url = opts.url;
  this.redis = new Redis(this.url);
}
util.inherits(RedisCache, Cache);

RedisCache.prototype.set = function(key, value) {
  debug('[redis]', `set ${key} to ${JSON.stringify(value)}`);
  return this.redis.set(key, value);
}
RedisCache.prototype.get = function(key) {
  return this.redis.get(key);
}
RedisCache.prototype.close = function() {
  debug('start closing redis cli');
  return this.redis.disconnect();
}

exports.Cache = Cache;
exports.RedisCache = RedisCache;
