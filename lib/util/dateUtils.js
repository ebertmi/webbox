import Moment from 'moment';
import Config from '../../config/webbox.config';

export function toRelativeDate(date) {
  if (date) {
    try {
      return Moment(date).locale(Config.app.locale).fromNow();
    } catch (e) {
      console.error(`dateUtils.toRelativeDate: failed to convert date to relative format (date: ${date})`);
    }
  } else {
    return date;
  }
}