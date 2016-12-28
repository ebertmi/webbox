import Config from '../../config/webbox.config';

import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
const locale = require(`date-fns/locale/${Config.app.locale}`);

export function toRelativeDate(date) {
  if (date) {
    try {
      return distanceInWordsToNow(date, { locale: locale });
    } catch (e) {
      console.error(`dateUtils.toRelativeDate: failed to convert date to relative format (date: ${date})`);
    }
  } else {
    return date;
  }
}