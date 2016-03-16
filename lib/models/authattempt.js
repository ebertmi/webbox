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
  time: Type.date().required().default(R.now())
});

AuthAttempt.ensureIndex('ip');
AuthAttempt.ensureIndex('username');
AuthAttempt.ensureIndex('time');

AuthAttempt.defineStatic('detectAbuse', function (ip, username) {
  return new Promise(function (resolve, reject) {
    Async.parallel({
      abusiveIpCount: AuthAttempt.filter({ip: ip}).count().bindExecute(),
      abusiveIpUserCount: AuthAttempt.filter(
        {
          ip: ip,
          username: username
        }
    ).count().bindExecute()
    }, function (err, acc) {
      if (err) {
        console.info(acc);
        reject(err);
      }

      const ipLimitReached = acc.abusiveIpCount >= Config.auth.authAttempts;
      const ipUserLimitReached  = acc.abusiveIpUserCount >= Config.auth.authAttempts;
      const isAbuse = ipLimitReached || ipUserLimitReached;

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