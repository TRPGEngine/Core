const { Cache, RedisCache } = require('../lib/cache');

// let cache = new Cache();
let cache = new RedisCache('redis://127.0.0.1:6379/4');

(async () => {
  await cache.set('a', 1);
  let data = await cache.get('a');
  console.log(data);
  console.log('cache');
  cache.close();
})()
