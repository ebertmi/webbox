/**
 * @copyright 2015, Andrey Popp <8mayday@gmail.com>
 */

import moment from 'moment';
import React, {PropTypes} from 'react';

export class Time extends React.Component {
  render() {
    let value = this.props.value;
    let locale = this.props.locale;
    let relative = this.props.relative;
    let format = this.props.format;
    let valueFormat = this.props.valueFormat;
    let titleFormat = this.props.titleFormat;
    let Component = this.props.Component;
    let props = this.props;

    if (!value) {
      return <span>Invalid date</span>;
    }

    if (!moment.isMoment(value)) {
      value = moment(value, valueFormat, true);
    }

    if (locale) {
      value = value.locale(locale);
    }

    let machineReadable = value.format('YYYY-MM-DDTHH:mm:ssZ');

    if (relative || format) {
      let humanReadable = relative ? value.fromNow() : value.format(format);
      return (
        <Component
          {...props}
          dateTime={machineReadable}
          title={relative ? value.format(titleFormat) : null}>
          {humanReadable}
        </Component>
      );
    } else {
      return <time {...props}>{machineReadable}</time>;
    }
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
  ]).isRequired,

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
   * Component to use.
   */
  Component: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
};

Time.defaultProps = {
  titleFormat: 'YYYY-MM-DD HH:mm',
  Component: 'time'
};