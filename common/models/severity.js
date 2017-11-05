/**
 * Severity Constants that can be used in messages and status updates
 * https://github.com/Microsoft/vscode/blob/master/src/vs/base/common/severity.ts
 */
export const Severity = {
  0: "Ignore",
  1: "Info",
  2: "Warning",
  3: "Error",
  Ignore: 0,
  Info: 1,
  Warning: 2,
  Error: 3
};

export function typeToSeverity(type) {
  switch(type) {
    case 'error': return Severity.Error;
    case 'warning': return Severity.Warning;
    case 'info': return Severity.Info;
    default: return Severity.Ignore
  }
}

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