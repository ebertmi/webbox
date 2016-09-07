/**
 * D3 utilities for charts.
 */
import { formatDefaultLocale } from 'd3-format';
import { timeFormat, timeFormatDefaultLocale } from 'd3-time-format';
import { timeYear, timeMonth, timeWeek, timeDay, timeHour, timeMinute, timeSecond } from 'd3-time';

/**
 * German d3 locale information
 */
const GERMAN_LOCALE = {
  "decimal": ",",
  "thousands": ".",
  "grouping": [3],
  "currency": ["€", ""],
  "dateTime": "%a %b %e %X %Y",
  "date": "%d.%m.%Y",
  "time": "%H:%M:%S",
  "periods": ["AM", "PM"],
  "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  "shortMonths": ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Dez"]
};

// Set the default locale here!
timeFormatDefaultLocale(GERMAN_LOCALE);
export const germanFormatters = formatDefaultLocale(GERMAN_LOCALE);

/**
 * Formats a date in german date and time format.
 */
export const normalDateFormatter = timeFormat('%x %H:%M');

const formatMillisecond = timeFormat(".%L");
const formatSecond = timeFormat(":%S");
const formatMinute = timeFormat("%H:%M");
const formatHour = timeFormat("%Hh");
const formatDay = timeFormat("%a %d");
const formatWeek = timeFormat("%b %d");
const formatMonth = timeFormat("%B");
const formatYear = timeFormat("%Y");

/**
 * Automatically formats a date to a small representation for scale ticks
 *
 * @export
 * @param {any} date
 * @returns
 */
export function multiTimeFormat(date) {
  return (timeSecond(date) < date ? formatMillisecond
      : timeMinute(date) < date ? formatSecond
      : timeHour(date) < date ? formatMinute
      : timeDay(date) < date ? formatHour
      : timeMonth(date) < date ? (timeWeek(date) < date ? formatDay : formatWeek)
      : timeYear(date) < date ? formatMonth
      : formatYear)(date);
}