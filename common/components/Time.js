/**
 * @copyright 2015, Andrey Popp <8mayday@gmail.com>
 */

import moment from 'moment';
import React, {PropTypes} from 'react';

const ISO8601FORMAT = 'DD-MM-YYYYTHH:mm:ssZ';

export function Time(props) {
  let {value, locale, invalidDateString, relative, format, valueFormat, titleFormat, Component, ...rest} = props;

  if (!value || value === null) {
    return <span>{invalidDateString}</span>;
  }

  if (!moment.isMoment(value)) {
    value = moment(value, valueFormat, true);
  }

  if (locale) {
    value = value.locale(locale);
  }

  let machineReadable = value.format(ISO8601FORMAT);

  if (relative || format) {
    let humanReadable = relative ? value.fromNow() : value.format(format);
    return (
      <Component
        {...rest}
        dateTime={machineReadable}
        title={relative ? value.format(titleFormat) : null}>
        {humanReadable}
      </Component>
    );
  } else {
    return <time {...rest}>{machineReadable}</time>;
  }
}

Time.propTypes = {
  /**
   * Value.
   */
  value: PropTypes.oneOfType([
    PropTypes.instanceOf(moment.fn.constructor),
    PropTypes.instanceOf(Date),
    PropTypes.number,
    PropTypes.string
  ]),

  /**
   * If component should output the relative time difference between now and
   * passed value.
   */
  relative: PropTypes.bool,

  /**
   * Datetime format which is used to output date to DOM.
   */
  format: PropTypes.string,

  /**
   * Datetime format which is used to parse value if it's being a string.
   */
  valueFormat: PropTypes.string,

  /**
   * Datetime format which is used to set title attribute on relative or
   * formatted dates.
   */
  titleFormat: PropTypes.string,

  /**
   * Locale.
   */
  locale: PropTypes.string,

  /**
   * Change the invalid date string for the set locale
   */
  invalidDateString: PropTypes.string,

  /**
   * Component to use.
   */
  Component: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
};

Time.defaultProps = {
  value: null,
  titleFormat: 'YYYY-MM-DD HH:mm',
  Component: 'time',
  invalidDateString: 'Invalid Date'
};