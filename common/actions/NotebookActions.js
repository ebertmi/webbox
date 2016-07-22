import * as Types from '../constants/NotebookActionTypes';

/**
 * Assigns ids to all cells, that do not have one
 */
export function prepareCells() {
  return {
    type: Types.PREPARE_CELLS
  };
}

export function toggleNotebookMetadataEdit() {
  return {
    type: Types.TOGGLE_NOTEBOOK_META_EDIT
  };
}

export function toggleViewMode() {
  return {
    type: Types.TOGGLE_VIEW_MODE
  };
}

/**
 * Action for toggling the visiblity of the given cell
 *
 */
export function toggleCellVisibility(cellId) {
  return {
    type: Types.TOGGLE_CELL_VISIBILITY,
    cellId: cellId
  };
}

/**
 * Undo the last operation by getting the last state from the stack.
 */
export function undo() {
  return {
    type: Types.UNDO
  };
}

export function redo() {
  return {
    type: Types.REDO
  };
}

/**
 * Activates the editing mode for the cell with given index
 */
export function editCell(index) {
  return {
    type: Types.EDIT_CELL,
    index: index
  };
}

/**
 * Deactivates the editing mode for the current active cell
 */
export function stopEditCell() {
  return {
    type: Types.EDIT_CELL,
    index: -1 /* index that does not match any cells */
  };
}

/**
 * Deletes the cell with the given index
 */
export function deleteCell(index) {
  return {
    type: Types.DELETE_CELL,
    index: index
  };
}

export function updateCell(cellId, source) {
  return {
    type: Types.UPDATE_CELL,
    cellId: cellId,
    source: source
  };
}

export function updateCellMetadata(cellId, keyPath, value) {
  return {
    type: Types.UPDATE_CELL_META,
    cellId: cellId,
    value: value,
    keyPath: keyPath
  };
}

export function addCellsFromJS(cells, language, withHistory, callback) {
  return {
    type: Types.ADD_CELLS_FROM_JS,
    cells: cells,
    language: language,
    withHistory: withHistory,
    callback: callback
  };
}

export function addCell(index, cellType) {
  // ToDo: maybe some additional checks here?
  return {
    type: Types.ADD_CELL,
    index: index,
    cellType: cellType
  };
}

export function addCodeEmbedCell(index) {
  return addCell(index, 'codeembed');
}

export function addMarkdownCell(index) {
  return addCell(index, 'markdown');
}

export function addRawCell(index) {
  return addCell(index, 'raw');
}

export function addCodeCell(index) {
  return addCell(index, 'code');
}

export function moveCellUp(index) {
  return {
    type: Types.MOVE_CELL_UP,
    index: index
  };
}

export function moveCellDown(index) {
  return {
    type: Types.MOVE_CELL_DOWN,
    index: index
  };
}

export function updateCellSlideType(cellId, slideType) {
  return {
    type: Types.UPDATE_CELL_SLIDETYPE,
    cellId: cellId,
    slide_type: slideType
  };
}

export function save() {
  return {
    type: Types.SAVE
  };
}

/**
 * Update a direct key of the notebook
 */
export function updateNotebookMetadata(name, value) {
  return {
    type: Types.UPDATE_NOTEBOOK_META,
    name: name,
    value: value
  };
}