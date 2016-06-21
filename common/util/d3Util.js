import d3 from 'd3';

export const germanFormatters = d3.locale({
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
  "months": ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  "shortMonths": ["Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Dez"]
});

export const germanTimeFormat = germanFormatters.timeFormat.multi([
	[".%L", d => d.getMilliseconds()],
	[":%S", d => d.getSeconds()],
	["%I:%M", d => d.getMinutes()],
	["%Hh", d => d.getHours()],
	["%a %d", d => d.getDay() && d.getDate() != 1],
	["%b %d", d => d.getDate() != 1],
	["%B", d => d.getMonth()],
	["%Y", () => true]
]);