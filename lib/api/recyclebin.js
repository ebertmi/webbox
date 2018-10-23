/**
 * API for viewing deleted entries (Admin Dashboard)
 */
import RecycleBin from '../models/recyclebin';
import Thinky from '../util/thinky';

export async function getRecyclebinEntries(request, h) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let entries;
  let count;

  try {
    entries = await RecycleBin.orderBy({index: Thinky.r.desc('timeStamp')}).slice(sliceStart, sliceEnd).run();
    count = await RecycleBin.count().execute();
    response.entries = entries;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return response;
  } catch (err) {
    console.error('Api.getReycleBinEntries', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    return response;
  }
}