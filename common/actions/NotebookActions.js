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
export function editCell(id) {
  return {
    type: Types.EDIT_CELL,
    cellId: id
  };
}

/**
 * Deactivates the editing mode for the current active cell
 */
export function stopEditCell() {
  return {
    type: Types.EDIT_CELL,
    cellId: -1 /* id that does not match any cells */
  };
}

/**
 * Deletes the cell with the given id
 */
export function deleteCell(id) {
  return {
    type: Types.DELETE_CELL,
    cellId: id
  };
}

export function updateCell(id, source) {
  return {
    type: Types.UPDATE_CELL,
    cellId: id,
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

export function addCellFromJS(cell, language) {
  return {
    type: Types.ADD_CELL_FROM_JS,
    cell: cell,
    language: language
  };
}

export function addCell(afterId, cellType) {
  // ToDo: maybe some additional checks here?
  return {
    type: Types.ADD_CELL,
    afterId: afterId,
    cellType: cellType
  };
}

export function addCodeEmbedCell(afterId) {
  return addCell(afterId, 'codeembed');
}

export function addMarkdownCell(afterId) {
  return addCell(afterId, 'markdown');
}

export function addRawCell(afterId) {
  return addCell(afterId, 'raw');
}

export function moveCellUp(cellId) {
  return {
    type: Types.MOVE_CELL_UP,
    cellId: cellId
  };
}

export function moveCellDown(cellId) {
  return {
    type: Types.MOVE_CELL_DOWN,
    cellId: cellId
  };
}

export function updateCellSlideType(cellId, slideType) {
  return {
    type: Types.UPDATE_CELL_SLIDETYPE,
    cellId: cellId,
    slideType: slideType
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