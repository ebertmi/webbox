/**
 * @copyright 2015, Andrey Popp <8mayday@gmail.com>
 */
import deLocale from 'date-fns/locale/de';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import isDate from 'date-fns/is_date';
import React from 'react';
import PropTypes from 'prop-types';

const ISO8601FORMAT = 'DD-MM-YYYYTHH:mm:ssZ';

export function Time(props) {
  let {value, locale, invalidDateString, relative, dateFormat, titleFormat, Component, ...rest} = props;

  if (!value || value === null) {
    return <span>{invalidDateString}</span>;
  }

  if (isDate(value)) {
    value = parse(value);
  }

  let machineReadable = format(value, ISO8601FORMAT, { locale: deLocale});

  if (relative || format) {
    let humanReadable = relative ? distanceInWordsToNow(value, { locale: deLocale, addSuffix: true }) : format(value, dateFormat, { locale: deLocale });
    return (
      <Component
        {...rest}
        dateTime={machineReadable}
        title={relative ? format(value, titleFormat, { locale: deLocale}) : null}>
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
  dateFormat: PropTypes.string,

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
  invalidDateString: 'Invalid Date',
  locale: 'de'
};