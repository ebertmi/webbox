/**
 * The test result model.
 * Holds a Test Result for a specific embed and user
 */

import Promise from 'bluebird';
import Config from '../../config/webbox.config';
import Thinky from '../util/thinky';
const Type = Thinky.type;
const R = Thinky.r;

const RecycleBin = Thinky.createModel('RecycleBin', {
  id: Type.string(),
  model: Type.string(),
  userId: Type.string().default(null),
  data: Type.object().optional().default({}),
  timeStamp: Type.date().required().default(() => new Date())
});

RecycleBin.ensureIndex('timeStamp');
RecycleBin.ensureIndex('model');

RecycleBin.defineStatic('addEntry', function(data={}, model, userId) {
  let entry = new RecycleBin({
    userId: userId,
    timeStamp: R.now(),
    data,
    model
  });

  entry.save().error(err => {
    console.info('RecycleBin', err);
  });

  console.info('Added Recyclebin entry.');
});

export default RecycleBin;