/**
 * 
 * 
 */
var LDAP = require('ldapjs');


var ldapAuth = function (options) {
  var client = LDAP.createClient({
    url: options.url,
  });
  
  
  return function (username, password, callback) {
    var dn = options.dn + username;
    client.bind(dn, password, function (err) {
      if (err) {
        
      }
      
      client.unbind(function (err) {
        if (err) {
          
        }
      });
    });
  };
};

// authentification method
module.exports = function (request, username, password, callback) {
  // check params and pass to ldap
  
  // right now, always false
  callback(undefined, false, {});
};