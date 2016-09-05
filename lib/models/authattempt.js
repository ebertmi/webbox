'use strict';
/**
 * Stores authentication attempts. This is part of the abuse detection.
 */
const Thinky = require('../util/thinky');
const Async = require('async');
const Config = require('../../config/webbox.config');
const Promise = require('bluebird');
const Type = Thinky.type;
const R = Thinky.r;


let AuthAttempt = Thinky.createModel('AuthAttempt', {
  id: Type.string(),
  username: Type.string().optional(),
  ip: Type.string().required(),
  time: Type.date().required().default(() => new Date())
});

AuthAttempt.ensureIndex('ip');
AuthAttempt.ensureIndex('username');
AuthAttempt.ensureIndex('time');

AuthAttempt.defineStatic('detectAbuse', function (ip, username) {

  // ToDo: filter only attempts that are not older than Config.auth.abuseTimeout hours
  return new Promise(function (resolve, reject) {
    Async.parallel({
      abusiveIpCount: AuthAttempt.filter({ip: ip}).filter(attempt => {
        return R.now().sub(attempt('time')).lt(60*60);
      }).count().bindExecute(),
      abusiveIpUserCount: AuthAttempt.filter(
        {
          ip: ip,
          username: username
        }
    ).filter(attempt => {
      return R.now().sub(attempt('time')).lt(60*60);
    }).count().bindExecute()
    }, function (err, acc) {
      if (err) {
        reject(err);
      }

      const ipLimitReached = acc.abusiveIpCount >= Config.auth.authAttempts;
      const ipUserLimitReached  = acc.abusiveIpUserCount >= Config.auth.authAttempts;
      const isAbuse = ipLimitReached || ipUserLimitReached;

      console.info('detectAbuse', ipLimitReached, ipUserLimitReached, isAbuse);

      resolve(isAbuse);
    });
  });
});

AuthAttempt.defineStatic('deleteForUsername', function (username) {
  return AuthAttempt.filter({ username: username }).delete().execute()
  .then(() => {
    //console.info('Deleted auth attempts for ' + username);
  })
  .error((err) => {
    console.error(err);
  });
});

AuthAttempt.defineStatic('logAuthAttempt', function (ip, username) {
  console.info('logAuthAttempt', ip, username);

  const attempt = new AuthAttempt({
    ip: ip,
    username: username
  });

  // save attempt
  attempt.save().error(err => {
    console.error('AuthAttempt.logAuthAttempt', err);
  });
}),

module.exports = AuthAttempt;