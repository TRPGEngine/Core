let core = require('../index')();

core.run();
// console.log(core);
(async function() {
  console.log(await core.storage.connectAsync());
  core.close();
})()
