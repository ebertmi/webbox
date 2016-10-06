/**
 * API for viewing deleted entries (Admin Dashboard)
 */
import RecycleBin from '../models/recyclebin';
import Thinky from '../util/thinky';

export function getRecyclebinEntries(request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let entries;

  RecycleBin.orderBy({index: Thinky.r.desc('timeStamp')}).slice(sliceStart, sliceEnd).run()
  .then(res => {
    entries = res;
    return RecycleBin.count().execute();
  })
  .then(count => {
    response.entries = entries;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return reply(response);
  })
  .error(err => {
    console.error('Api.getReycleBinEntries', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    reply(response);
  });
}