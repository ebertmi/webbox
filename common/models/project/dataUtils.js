import isString from 'lodash/isString';

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
    let fileData = code[file];
    if (isString(fileData)) {
      project.addFile(file, fileData);
    } else {
      // handle complicated type
      project.addFile(file, fileData.content);
    }
  }

  let index = 0;
  let mainFile = data.meta.mainFile;

  // switch to specified mainFile
  if (mainFile) {
    index = project.getIndexForFilename(mainFile);

    index = index > -1 ? index : 0;
  }

  // switch to first tab
  if (project.tabManager.getTabs().length > 1) {
    let oldTab = project.tabManager.getTabs()[index];
    // Switch files inside the tabs array
    project.tabManager.getTabs().splice(index, 1); // Remove tab from tabs
    project.tabManager.getTabs().unshift(oldTab);

    // Switch to first tab
    project.tabManager.switchTab(0);
  }
}

/**
 * ToDo
 *
 * @export
 * @param {any} project
 * @param {any} data
 */
export function reloadFromData(project, data) {

}