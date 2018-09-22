import isString from 'lodash/isString';

/**
 * This function determines which data to load from the given embed (from the server) and
 * loads it in the project.
 *
 * @export
 * @param {any} project - reference to project
 * @param {any} data  - embed data that might include a code document
 * @param {boolean} [ignoreDocument=false] - ignores the included document if set to true
 *
 * @returns {undefined}
 */
export function loadFromData(project, data, ignoreDocument=false) {
  let code;

  // Check if there is already a document on the data and try to load from there
  if (!ignoreDocument && data._document && data._document.code) {
    code = data._document.code;
  } else {
    code = data.code;
  }

  // Clear previous tabs
  project.tabManager.clear();

  for (let file in code) {
    const fileData = code[file];
    if (isString(fileData)) {
      project.addFile(file, fileData);
    } else {
      // handle complicated type
      project.addFile(file, fileData.content);
    }
  }

  let index = 0;
  const mainFile = data.meta.mainFile;

  // switch to specified mainFile
  if (mainFile) {
    index = project.getIndexForFilename(mainFile);

    index = index > -1 ? index : 0;
  }

  // switch to first tab
  if (project.tabManager.getTabs().length > 1) {
    const oldTab = project.tabManager.getTabs()[index];
    // Switch files inside the tabs array
    project.tabManager.getTabs().splice(index, 1); // Remove tab from tabs
    project.tabManager.getTabs().unshift(oldTab);

    // Switch to first tab
    project.tabManager.switchTab(0);
  }

  // Otherwise we have unsaved changes, when adding files
  project.hasUnsavedChanges = false;
  project.tabManager.clearFileChanges();
}

/**
 * ToDo
 *
 * @export
 * @param {any} project - project
 * @param {any} data - data
 *
 * @returns {undefined}
 */
export function reloadFromData(project, data) {
}