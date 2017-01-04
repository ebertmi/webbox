/**
 * Tries to extract the real client IP, if request was forwarded by nginx
 *
 * @export
 * @param {any} request
 * @returns
 */
export function extractClientIp(request) {
  //from http://stackoverflow.com/questions/29496257/knowing-request-ip-in-hapi-js-restful-api
  let xFF = request.headers['x-forwarded-for'];
  let splitRes = xFF ? xFF.split(',') : null;
  let ip = splitRes ? splitRes[splitRes.length-1] : request.info.remoteAddress;
  return ip;
}

/**
 * Default fail action for routes, It does set the request.pre.validation object
 * to the error output of the validation result and continues the request.
 * It is important to check the request.pre.validation in the handler!
 *
 * @param {any} request
 * @param {any} reply
 * @param {any} source
 * @param {any} error
 */
export function validationfailAction (request, reply, source, error) {
  request.pre.validation = error.output.payload.validation;
  reply.continue();
}