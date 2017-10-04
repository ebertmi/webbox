import head from 'lodash/head';
import last from 'lodash/last';
import { timeYear, timeMonth, timeWeek, timeDay } from 'd3-time';
import Debug from 'debug';

// Create namespaced debug function | see https://github.com/visionmedia/debug
const debug = Debug('webbox:dateUtils');

export function sortedRange(start, stop) {
  let range = [start, stop];
  range.sort((a, b) => {
    return a - b;
  });
  return range;
}

/**
 * Automatic point to logarithmic time interval bounds:
 *  1. Check number of data points
 *  2. Check largest difference between data first and last datapoint
 *      -> a) if difference is 1 year, then split the months, split last month into weeks
 *      -> b) if difference is more than 1 year, split into years and use the latest year as in point a
 *      -> c) if difference is less than 1 year, split into months
 *      -> d) if difference is less than 1 month, split into weeks
 *  3. Create intervalBounds from the split points
 *  4. Cluster time points by the interval bounds
 *  5. Remove empty clusters
 *	6. Done :)
 */
export function toLogarithmicDateIntervals(timePoints) {
  let years = [];
  let months = [];
  let weeks = [];
  let days = [];

  let intervalBounds = [];

  timePoints.sort((a, b) => {
    return a - b;
  });

  // no interval bounds, when no entries
  if (timePoints.length === 0) {
    return [];
  }

  years = timeYear.range(...sortedRange(head(timePoints), last(timePoints)));

  // Now get the latest to split into months
  if (years.length === 0) {
    months = timeMonth.range(...sortedRange(head(timePoints), last(timePoints)));
  } else {
    months = timeMonth.range(...sortedRange(last(years), last(timePoints)));

    // Add every year, except last one to the interval bounds list
    intervalBounds.push(...years.slice(0, -1));
  }

  // Now split the months into weeks
  if (months.length === 0) {
    weeks = timeWeek.range(...sortedRange(head(timePoints), last(timePoints)));
  } else {
    weeks = timeWeek.range(...sortedRange(last(months), last(timePoints)));

    // Add every week, except last one to the interval bounds list
    intervalBounds.push(...weeks.slice(0, -1));
  }

  // Now split the weeks into days
  if (weeks.length === 0) {
    let range = sortedRange(head(timePoints), last(timePoints));
    days = timeDay.range(...range);
  } else {
    days = timeDay.range(...sortedRange(last(weeks), last(timePoints)));
  }

  if (days.length === 0) {
    // Just add a single time point, time points do have at least 1 element here!
    intervalBounds.push(last(timePoints));
  } else {
    // Add any remaining day
    intervalBounds.push(...days);
  }

  debug('Finished logarithmic intervald bounds creation: ', years, months, weeks, days, intervalBounds);

  return intervalBounds;
}

function isDateWithinRange(date, lower, upper) {
  if (lower == null && upper != null) {
    return date < upper;
  } else if (lower != null && upper == null) {
    return date >= lower;
  } else {
    return date >= lower && date < upper;
  }
}

export function clusterDataPointsByDateIntervals(dataPoints, dateAccessor=(dp=>dp.time), intervals) {
  let clusters = intervals.map(() => []); // Create array of empty clusters
  let i;
  let clusterIterationLength = intervals.length - 1 < 0 ? 0 : intervals.length - 1;

  for (let dp of dataPoints) {
    // iterate over all intervals
    let time = dateAccessor(dp);
    time = normalizeDate(time, normalizeDate.Day);

    for (i = 0; i <= clusterIterationLength; i++) {
      let isIn = false;
      // Special case i = 0
      if (i == 0) {
        isIn = time <= intervals[i];
        debug('clusterDataPointsByDateIntervals: first special case', time, isIn);
      }

      if (isIn === false && i == clusterIterationLength) {
        // Special case i = clusterIterationLength - 2 // last interval
        isIn = time >= intervals[i];
        debug('clusterDataPointsByDateIntervals: last special case', time, isIn);
      }

      if (isIn === false) {
        // Normal case, check upper and lower bounds, lower inclusive
        isIn = isDateWithinRange(time, intervals[i], intervals[i+1]);
        debug('clusterDataPointsByDateIntervals: normal case', time, isIn);
      }

      if (isIn === true) {
        clusters[i].push(dp);
      }
    }
  }

  return clusters;
}

/**
 * Normalize a date depending on the current "dateClusterResolution"
 * @param {any} str
 * @returns
*/
export function normalizeDate(str, resolution='day') {
  let dt = new Date(str);

  switch (resolution) {
    case 'month':
      return new Date(
        dt.getFullYear(),
        dt.getMonth()
      );
    case 'hour':
      return new Date(
          dt.getFullYear(),
          dt.getMonth(),
          dt.getDate(),
          dt.getHours()
      );
    case 'day':
    default:
      return new Date(
          dt.getFullYear(),
          dt.getMonth(),
          dt.getDate()
      );
  }
}

normalizeDate.Day = 'day';
normalizeDate.Hour = 'hour';
normalizeDate.Month = 'month';