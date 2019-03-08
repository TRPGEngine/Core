const Raven = require('raven');
const appLogger = require('./logger')('application');
const errorLogger = require('./logger')('error');

module.exports = Report;

// 默认设置
const defaultConfig = {
  logger: true,
  sentry: false, // 如果有则为Sentry DSN http://xxxxxxx@sentry.xxxxx.com/x 格式
}

function Report(reportSetting) {
  this._setting = Object.assign({}, defaultConfig, reportSetting);
  if(this._setting.sentry) {
    Raven.config(this._setting.sentry).install();
  }
}

Report.prototype.reportError = function(err) {
  const setting = this._setting;
  if(setting.logger) {
    errorLogger.error(err)
  }

  if(setting.sentry) {
    Raven.captureException(err, function (err, eventId) {
      console.log('[Sentry] Reported error: ' + eventId);
      appLogger.info('[Sentry] Reported error: ' + eventId);
    });
  }
}
