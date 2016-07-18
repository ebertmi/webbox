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