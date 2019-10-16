import { Severity } from './severity';

export class Annotation {
  constructor(message, startLineNumber, startColumn, severity, endLineNumber, endColumn, code=null, source=null) {
    this.message = message;
    this.severity = severity;

    this.startLineNumber = startLineNumber;
    this.startColumn = startColumn;
    this.endLineNumber = endLineNumber == null ? startLineNumber : endLineNumber;
    this.endColumn = endColumn == null ? startColumn : endColumn;

    this.code = code;
    this.source = source;


    if (!(this.severity in Severity)) {
      throw new Error(`Invalid Severity level used for creating an Annotation (${this.severity})`);
    }
  }
}
