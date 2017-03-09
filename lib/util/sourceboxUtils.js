import JWT from 'jsonwebtoken';
import Config from '../../config/webbox.config';

/**
 * This utility function creates a sourcebox object for the context data that contains
 * all relevant connection data for the sourcebox websocket.
 * 
 * If a user cannot access sourcebox and/or is not logged in, the function returns still
 * the object but with an empty authToken.
 * 
 * @export
 * @param {boolean} canAccessSourcebox 
 * @param {string} username 
 * @param {string} userid 
 * @returns {Object} an object with an 'sourcebox' key containing all data
 * @throws {JsonWebTokenError } if the signing or data is invalid or missing
 */
export function createSourceboxContextData(canAccessSourcebox, username, userid) {
  const sourcebox = {
    server: Config.sourcebox.url,
    authToken: null,
    transports: Config.sourcebox.transports
  };

  // exit early if user does not have the rights to access sourcebox
  if (canAccessSourcebox === false || userid == null || username == null) {
    return sourcebox;
  }

  // create the token
  let sourceboxAuthToken;

  sourceboxAuthToken = JWT.sign({
    username,
    userid
  }, Config.sourcebox.secret, {
    expiresIn: Config.sourcebox.expiresIn
  });

  sourcebox.authToken = sourceboxAuthToken;

  return sourcebox;
}
