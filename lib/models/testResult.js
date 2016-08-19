'use strict';

/**
 * The test result model.
 * Holds a Test Result for a specific embed and user
 */

import Promise from 'bluebird';
import Config from '../../config/webbox.config';
import Thinky from '../util/thinky';
const Type = Thinky.type;
const R = Thinky.r;

function firstArrayElement(arr) {
  if (arr && arr.length > 0) {
    return arr[0];
  } else {
    return undefined;
  }
}

export const TestResult = Thinky.createModel('TestResult', {
  id: Type.string(),
  userId: Type.string().default(null),
  embedId: Type.string().default(null),
  score: Type.number().default(0),
  scorePercentage: Type.number().default(0),
  data: Type.object().optional().default({}),
  timeStamp: Type.date().required().default(() => new Date())
});

/**
 * Either create a new TestResult for the given embedId and userId or update a previous one.
 */
TestResult.defineStatic('updateOrCreate', function (testResult) {
  TestResult.filter({ embedId: testResult.embedId, userId: testResult.userId }).then(r => {
    if (r && r.length > 0) {
      // Previous entry found
      let result = firstArrayElement(r);
      if (result !== undefined) {
        // Time for updating
        result.merge(testResult).save().error(err => {
          console.error('TestResult: Failed to update the TestResult with new data', err);
        });
      } else {
        // We need to create a new one
        result = new TestResult(testResult);
        result.save().error(err => {
          console.error('TestResult: Failed to save the TestResult', err);
        });
      }
    }
  }).error(err => {
    console.info(err);
  });

  // ToDo:
  //  1. Check if there is already an entry
  //  2. If there is an entry, update the entry
  //  3. Otherwise create new
});

TestResult.ensureIndex('userId');
TestResult.ensureIndex('embedId');
TestResult.ensureIndex('timeStamp');

export default TestResult;