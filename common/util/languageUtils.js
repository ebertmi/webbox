const LANGUAGE_EXT = new Map([
  ['python', 'py'],
  ['python2', 'py'],
  ['python3', 'py'],
  ['c#', 'cs'],
  ['cs', 'cs'],
  ['cpp', 'cpp'],
  ['c', 'c'],
  ['c13', 'c'],
  ['java', 'java'],
  ['java7', 'java'],
  ['java8', 'java'],
  ['ruby', 'rb']
]);

const LANGUAGE_TEMPLATES = new Map([
  ['python', 'print "Hi"'],
  ['python2', 'print "Hi"'],
  ['python3', 'print("Hi")'],
  ['c#', ''],
  ['cs', ''],
  ['cpp', ''],
  ['c', '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\nprintf("Hi");\nreturn 0;\n}'],
  ['java', ''],
  ['ruby', '']
]);

export function getFileExtensionByLanguage (language) {
  return LANGUAGE_EXT.get(language);
}

/**
 * Returns a template code file (source content) for the given language.
 *
 * @export
 * @param {any} language
 * @returns String with template source
 */
export function getTemplateContentByLanguage (language) {
  let ret = LANGUAGE_TEMPLATES.get(language);
  return ret != undefined ? ret : '';
}