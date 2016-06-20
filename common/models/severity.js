/**
 * Severity Constants that can be used in messages and status updates
 * https://github.com/Microsoft/vscode/blob/master/src/vs/base/common/severity.ts
 */
export const Severity = {
  "Ignore": "ignore",
  "Info": "info",
  "Warning": "warning",
  "Error": "danger"
};

export function toBootstrapClass(severity) {
  switch (severity) {
    case Severity.Info: return 'info';
    case Severity.Warning: return 'warning';
    case Severity.Error: return 'danger';
    default: return 'default';
  }
}

export function toSeverityAppClass(severity) {
  switch (severity) {
    case Severity.Info: return 'app-info';
    case Severity.Warning: return 'app-warning';
    case Severity.Error: return 'app-error';
    default: return 'app-info';
  }
}

export function toTextLabel(severity) {
  // maybe support here multiple languages at some point
  switch (severity) {
    case Severity.Info: return 'Info';
    case Severity.Warning: return 'Hinweis';
    case Severity.Error: return 'Fehler';
    case Severity.Ignore: return 'Meldung';
    default: return '';
  }
}