import Immutable from 'immutable';
import * as Types from '../../constants/NotebookActionTypes';
import UUID from 'uuid';

import isArray from 'lodash/isArray';
import isInteger from 'lodash/isInteger';
import isFunction from 'lodash/isFunction';
import capitalize from 'lodash/capitalize';

import { EmbedTypes } from '../../constants/Embed';
import assert from '../../util/assert';

export const initialState = Immutable.Map({
  metadata: Immutable.fromJS({
    kernelspec: {
      name: "webbox",
      language: "python",
      display_name: "Python 3"
    },
    language_info: {
      name: "python",
      version: "3"
    },
    title: '',
    author: '',
    lastUpdate: Date.now()
  }),
  cellOrder: new Immutable.List(),
  cells: new Immutable.Map(),
  notebookMetadataEditable: false, /* toggle notebook metadata edit mode */
  activeBlock: -1, /* current block in editing mode */
  isAuthor: false, /* should be canEdit, as only authors or admins can edit pages */
  canToggleEditMode: false,
  authors: new Immutable.List(),
  nbformat: 4, /* required by nbformat */
  nbformat_minor: 0,
  undoStack: Immutable.List(),
  redoStack: Immutable.List()
});

export default function notebook(state = initialState, action) {
  let newState;
  let newCell;

  switch (action.type) {
    case Types.TOGGLE_NOTEBOOK_META_EDIT:
      newState = toggleNotebookMetadataEditable(state);
      return newState;

    case Types.TOGGLE_VIEW_MODE:
      newState = toggleViewMode(state);
      return newState;

    case Types.UNDO:
      return undo(state);

    case Types.REDO:
      newState = redo(state);
      return updateStateWithHistory(state, newState);

    case Types.EDIT_CELL:
      return changeActiveBlock(state, action.index);

    case Types.DELETE_CELL:
      newState = deleteCellWithIndex(state, action.index);
      return updateStateWithHistory(state, newState);

    case Types.ADD_CELL:
      newCell = createNewCellByType(action.cellType);
      let res = addCellWithIndex(state, action.index, newCell);
      newState = updateStateWithHistory(state, res.state);

      // after adding the cell we immediatelly make it editable
      // ToDo: figure out how we get the index of the new file
      return changeActiveBlock(newState, res.index);

    case Types.UPDATE_CELL:
      newState = updateCellWithSource(state, action.cellId, action.source);
      return updateStateWithHistory(state, newState); // ToDO: broken, in MarkdownCell wrapperNode!

    case Types.MOVE_CELL_DOWN:
      newState = moveCellDownWithIndex(state, action.index);
      return updateStateWithHistory(state, newState);

    case Types.MOVE_CELL_UP:
      newState = moveCellUpWithIndex(state, action.index);
      return updateStateWithHistory(state, newState);

    case Types.UPDATE_CELL_SLIDETYPE:
      newState = updateCellSlidetype(state, action.cellId, action.slide_type);
      return updateStateWithHistory(state, newState);

    case Types.UPDATE_CELL_META:
      newState = updateCellMetadata(state, action.cellId, action.keyPath, action.value);
      return updateStateWithHistory(state, newState);

    case Types.UPDATE_NOTEBOOK_META:
      newState = updateNotebookMetadata(state, action.name, action.value);
      return newState;
      //return updateStateWithHistory(state, newState);

    case Types.ADD_CELLS_FROM_JS:
      // avoid history for initial state
      newState = updateAddCellsFromJS(state, action.cells, action.language);

      if (action.withHistory === true) {
        newState = updateStateWithHistory(state, newState);
      }

      // trigger callback if any
      if (isFunction(action.callback)) {
        action.callback.call(null);
      }

      return newState;


    default:
      return state;
  }
}

/**
 * Deletes a cell for the given index:
 *  - Removes the cell from "cells" (Map)
 *  - Removes the cell from "cellOrder" (List)
 *  - Unset active block, if it is this cell
 */
function deleteCellWithIndex(state, index) {
  const key = state.getIn(['cellOrder', index]);
  let newState = state;

  // Disable edit for the index of the cell, otherwise the next cell gets activated
  let activeBlock = state.get('activeBlock');
  if (activeBlock === index) {
    newState = state.set('activeBlock', -1);
  }

  return newState.deleteIn(['cells', key]).deleteIn(['cellOrder', index]);
}

/**
 * Update the given cell with the provided source
 */
function updateCellWithSource(state, cellId, source) {
  let cells = state.get('cells');

  // ToDo: what happens if cellId is not found?
  if (cellId === undefined) {
    console.warn('NotebookReducer.updateCellWithSource could not find cell for cellId ', cellId);
    return state;
  }
  let cell = cells.get(cellId); // get the cell

  // now update the cell
  let newCell = cell.set('source', source);
  let newCells = cells.set(cellId, newCell);

  return state.set('cells', newCells);
}

function updateCellMetadata(state, cellId, keyPath, value) {
  let cells = state.get('cells');
  let cell = cells.get(cellId); // get the cell
  let newCell;

  if (!cell) {
    console.warn('NotebookReducer.updateCellSlidetype could not find cell for id ', cellId);
    return state;
  }

  // check of keyPath array and split the string on dots "." (dotted paths)
  if (!isArray(keyPath)) {
    keyPath = keyPath.split('.');
  }

  if (keyPath.length === 0 || keyPath[0] === '') {
    return state; // nothing to change
  }

  // add metadata path as first path part
  if (keyPath[0] !== 'metadata') {
    keyPath.unshift('metadata');
  }

  if (value !== null && value !== undefined) {
    // update the key with new value, which may be a empty string
    newCell = cell.setIn(keyPath, value);
  } else {
    // delete the key!
    newCell = cell.deleteIn(keyPath);
  }

  return state.set('cells',  cells.set(cellId, newCell));
}

function updateCellSlidetype(state, cellId, slideType) {
  let cells = state.get('cells');
  let cell = cells.get(cellId); // get the cell

  if (!cell) {
    console.warn('NotebookReducer.updateCellSlidetype could not find cell for id ', cellId);
    return state;
  }

  // now update the cell
  let newCell = cell.setIn(['metadata', 'slideshow', 'slide_type'], slideType);
  return state.set('cells',  cells.set(cellId, newCell));
}

/**
 * Creates a new empty Cell for the given type. Format is translated into nbformatv4
 */
function createNewCellByType(cellType) {
  let newCell = {
    metadata: {
      slideshow: {
        slide_type: ''
      }
    },
    id: UUID.v4(),
    source: ''
  };

  switch (cellType) {
    case 'code':
      newCell.cell_type = 'code';
      break;
    case 'markdown':
      newCell.cell_type = 'markdown';
      break;
    case 'codeembed':
      newCell.cell_type = 'codeembed';
      break;
    default:
      newCell.cell_type = 'raw';
      newCell.metadata.format = 'text/plain'; /* output as text as default */
  }

  return Immutable.fromJS(newCell);
}

/**
 * Add a new cell at the given index:
 *  - The cell must have an id
 *  - The cell is added to the "cells" property
 *  - The cell is added to "cellOrder" at the given index or added to the end of the list
 */
/**
 *
 *
 * @export
 * @param {any} state
 * @param {any} index
 * @param {any} newCell
 * @returns {Object} containing a state and the index
 */
export function addCellWithIndex(state, index, newCell) {
  if (!newCell) {
    console.warn(`NotebookReducer.addCell(): Invalid argument 'newCell' (${newCell})`);
  }

  let newState;
  let cellId = newCell.get('id');
  newState = state.set('cells', state.get('cells').set(cellId, newCell));

  if (isInteger(index)) {
    newState = newState.set('cellOrder', newState.get('cellOrder').insert(index, cellId));
  } else {
    // when not index is specified, we just push the cell to the end of the list
    newState = newState.set('cellOrder', newState.get('cellOrder').push(cellId));
    index = newState.get('cellOrder').size - 1;
  }

  return {
    state: newState,
    index: index
  };
}

/**
 * Moves the cell with the specified index down
 */
function moveCellDownWithIndex(state, index) {
  let cell;
  let nextCell;
  let newCellOrder;
  let cellOrder = state.get('cellOrder');

  // cannot move lower than last
  if (index === (cellOrder.size - 1)) {
    return state;
  }

  cell = cellOrder.get(index);
  nextCell = cellOrder.get(index + 1);

  newCellOrder = cellOrder.set(index, nextCell).set(index + 1, cell);
  return state.set('cellOrder', newCellOrder);
}

/**
 * Moves the cell with the specified index up
 */
function moveCellUpWithIndex(state, index) {
  let cell;
  let nextCell;
  let newCellOrder;
  let cellOrder = state.get('cellOrder');

  // cannot move higher than first position
  if (index === 0) {
    return state;
  }

  cell = cellOrder.get(index);
  nextCell = cellOrder.get(index - 1);

  newCellOrder = cellOrder.set(index, nextCell).set(index - 1, cell);
  return state.set('cellOrder', newCellOrder);
}

/**
 * Changes the active block (current cell in edit mode)
 */
function changeActiveBlock(state, index) {
  return state.set('activeBlock', index);
}

/**
 * Toggles the notebook metadata edit mode
 */
function toggleNotebookMetadataEditable(state) {
  if (state.get('notebookMetadataEditable')) {
    return state.set('notebookMetadataEditable', false);
  } else {
    return state.set('notebookMetadataEditable', true);
  }
}

/**
 * Toggles the edit tools and icons for authors
 * Disables the edit mode for the current active block/cell
 */
function toggleViewMode(state) {
  if (state.get('isAuthor')) {
    return state.set('isAuthor', false).set('activeBlock', -1);
  } else {
    return state.set('isAuthor', true);
  }
}

function updateNotebookMetadata(state, name, value) {
  let _split;
  let _name; // language name
  let _version;
  let newState;

  switch(name) {
    case 'slug':
      return state.set('slug', value);
    case 'course':
      return state.set('course', value);
    case 'embedType':
      if (value === EmbedTypes.Skulpt || value === EmbedTypes.Sourcebox) {
        return state.set('embedType', value);
      } else {
        console.warn('updateNotebookMetadata called with invalid "embedType"');
        return state;
      }
    case 'title':
    case 'author':
      return state.setIn(['metadata', name], value);
    case 'language':
      // Set the kernelspec and language_info automatically
      // In the UI we use values like "python-3" for every language "language-version", all lower case
      assert(value.includes('-'), 'notebookReducer.updateNotebookMetadata received invalid value for "language"', value);
      _split = value.split('-'); // special format

      assert(_split.length === 2, 'notebookReducer.updateNotebookMetadata received invalid value for "language"', value);

      _name = _split[0];
      _version = _split[1];

      newState = state.setIn(['metadata', 'kernelspec', 'language'], _name);
      newState = newState.setIn(['metadata', 'kernelspec', 'display_name'], `${capitalize(_name)} ${_version}`);
      newState = newState.setIn(['metadata', 'language_info', 'name'], _name);
      newState = newState.setIn(['metadata', 'language_info', 'version'], _version);

      return newState;
    default:
      return state;
  }
}

export function updateAddCellsFromJS(state, cells, lang) {
  if (!cells) {
    console.log('notebookReducer.updateAddCellFromJS called with invalid cell');
    return;
  }

  let newState = state;

  if (!Array.isArray(cells)) {
    cells = [].push(cells);
  }

  for (let cell of cells) {
    // Check metadata
    if (!cell.metadata) {
      cell.metadata = {};
    }

    if (!cell.metadata.slideshow) {
      cell.metadata.slideshow = {
        slide_type: 'slide'
      };
    }

    if (cell.cell_type === 'code' && cell.metadata.mode === undefined) {
      cell.metadata.mode = lang || 'plain';
    }

    // assign unique id
    if (!cell.id) {
      cell.id = UUID.v4();
    }

    // check for nbformat 3 code cell "input" property
    if (!cell.source && cell.input) {
      cell.source = cell.input;
    }

    let immutableCell = Immutable.fromJS(cell);
    // ToDo: Change this
    newState = addCellWithIndex(newState, null, immutableCell).state; // push cell to the end of the list
  }

  return newState;
}

/**
 * Pops the last item from the undo stack.
 */
function undo(state) {
  let newState;

  if (state.get('undoStack').size === 0) {
    return state;
  }

  // pop previous state from undo stack
  newState =  state.get('undoStack').last().set('undoStack', state.get('undoStack').pop());

  // push previous state on redo stack
  newState = newState.set('redoStack',  state.get('redoStack').push(state.remove('redoStack').remove('undoStack')));

  return newState;
}

function redo(state) {
  if (state.get('redoStack').size === 0) {
    return state;
  }

  // pop next state from redo stack
  let undoStack = state.get('undoStack');
  let newState = state.get('redoStack').last().set('redoStack', state.get('redoStack').pop());
  newState.set('undoStack', undoStack);

  return newState;
}

/*
 * Handles changes, if they exist, by pushing to the undo stack.
 */
function updateStateWithHistory(currentState, newState) {
  if (currentState.equals(newState)) {
    return newState;
  }
  let result = newState.set('undoStack',  currentState.get('undoStack').push(currentState.remove('undoStack').remove('redoStack')))
  .setIn(
    ['metadata', 'newStateCreatedAt'],
      new Date()
    );

  return result;
}
