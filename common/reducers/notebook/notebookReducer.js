import Immutable from 'immutable';
import * as Types from '../../constants/NotebookActionTypes';
import UUID from 'uuid';

import isArray from 'lodash/isArray';

export const initialState = Immutable.Map({
  metadata: Immutable.fromJS({
    kernel_info: {
      name: "webbox"
    },
    language_info: {
      name: "",
      version: ""
    },
    title: 'Mein erstes Webbox-Notebook',
    author: 'Michael Ebert',
    lastUpdate: Date.now()
  }),
  cells: Immutable.fromJS([{
    cell_type: 'markdown',
    metadata: {
      slideshow: {
        slide_type: 'slide' /* slide, fragment[, subslide], skip, notes */
      }
    },
    source: "## Hello\nEtwas Text und vielleicht das ein oder andere Gedicht. Aber jetzt kommen wir zu etwas coolem: `inline-code` und\n```python\ndef fu():\n\tpass\n```"
  }, {
    cell_type: 'codeembed',
    metadata: {
      slideshow: {
        slide_type: 'fragment' /* slide, fragment[, subslide], skip, notes */
      },
      width: 900,
      height: 400
    },
    source: 'db0cadd0-fe97-415b-96f6-90ecbd2d11e0'
  }, {
    cell_type: 'markdown',
    metadata: {
      slideshow: {
        slide_type: 'slide'
      }
    },
    source: "## Hello\n\nUnd noch mehr tExt und wenn das Speichern geht, dann geht es ab!"
  }, {
    cell_type: 'code',
    metadata: {
      slideshow: {
        slide_type: 'slide'
      },
      mode: 'java'
    },
    source: "public static void main(String args[]) {\n\tSystem.out.println(\"test\");\n}"
  }]),
  notebookMetadataEditable: false, /* toggle notebook metadata edit mode */
  slug: 'mein-erstes-webbox-notebook',
  activeBlock: -1, /* current block in editing mode */
  isAuthor: true, /* should be canEdit, as only authors or admins can edit pages */
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
      newState = updateStateWithHistory(state, toggleNotebookMetadataEditable(state));
      return newState;
    case Types.UNDO:
      return undo(state);
    case Types.REDO:
      newState = redo(state);
      return updateStateWithHistory(state, newState);
    case Types.EDIT_CELL:
      return changeActiveBlock(state, action.cellId);
    case Types.DELETE_CELL:
      newState = deleteCellFromList(state, action.cellId);
      return updateStateWithHistory(state, newState);
    case Types.ADD_CELL:
      newCell = createNewCellByType(action.cellType);
      newState = addCellToList(state, action.afterId, newCell);
      newState = updateStateWithHistory(state, newState);

      // after adding the cell we immediatelly make it editable
      return changeActiveBlock(newState, newCell.get('id'));
    case Types.UPDATE_CELL:
      newState = updateCellWithSource(state, action.cellId, action.source);
      return updateStateWithHistory(state, newState); // ToDO: broken, in MarkdownCell wrapperNode!
    case Types.PREPARE_CELLS:
      newState = prepareCellsWithIds(state);
      return newState;
    case Types.MOVE_CELL_DOWN:
      newState = moveCellDown(state, action.cellId);
      return updateStateWithHistory(state, newState);
    case Types.MOVE_CELL_UP:
      newState = moveCellUp(state, action.cellId);
      return updateStateWithHistory(state, newState);
    case Types.UPDATE_CELL_SLIDETYPE:
      newState = updateCellSlidetype(state, action.cellId, action.slide_type);
      return updateStateWithHistory(state, newState);
    case Types.UPDATE_CELL_META:
      newState = updateCellMetadata(state, action.cellId, action.keyPath, action.value);
      return updateStateWithHistory(state, newState);
    case Types.UPDATE_NOTEBOOK_META:
      newState = updateNotebookMetadata(state, action.name, action.value);
      return updateStateWithHistory(state, newState);
    default:
      return state;
  }
}

/**
 * Assigns every cell a unique id if not already given
 */
function prepareCellsWithIds(state) {
  const cells = state.get('cells').toArray();

  // iterate over each cells, and update with id if there isn't any
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i].id) {
      cells[i] = cells[i].set('id', UUID.v4()); // create new unique id
    }
  }

  return state.set('cells', new Immutable.List(cells));
}

/**
 * Update the given cell with the provided source
 */
function updateCellWithSource(state, cellId, source) {
  let cells = state.get('cells');
  let key = findCellKey(state, cellId);

  // ToDo: what happens if cellId is not found?
  if (key === undefined) {
    console.warn('NotebookReducer.updateCellWithSource could not find cell for id ', cellId);
    return state;
  }
  let cell = cells.get(key); // get the cell

  // now update the cell
  let newCell = cell.set('source', source);
  let newCells = cells.set(key, newCell);

  return state.set('cells', newCells);
}

function updateCellMetadata(state, cellId, keyPath, value) {
  let cells = state.get('cells');
  let key = findCellKey(state, cellId);
  let cell = cells.get(key); // get the cell
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

  return state.set('cells',  cells.set(key, newCell));
}

function updateCellSlidetype(state, cellId, slideType) {
  let cells = state.get('cells');
  let key = findCellKey(state, cellId);
  let cell = cells.get(key); // get the cell

  if (!cell) {
    console.warn('NotebookReducer.updateCellSlidetype could not find cell for id ', cellId);
    return state;
  }

  // now update the cell
  let newCell = cell.setIn(['metadata', 'slideshow', 'slide_type'], slideType);

  return state.set('cells',  cells.set(key, newCell));
}

/**
 * Creates a new empty Cell for the given type. Format is translated into nbformatv4
 */
function createNewCellByType(cellType) {
  let newCell = {
    metadata: {
      slideshow: {

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
 * Add a new cell after the given cellId
 */
function addCellToList(state, afterId, newCell) {
  let cells = state.get('cells');
  let key = findCellKey(state, afterId);

  return state.set('cells', cells.insert(key, newCell));
}

/**
 * Delete the cell in the notebook at the given id.
 */
function deleteCellFromList(state, cellId) {
  let cells = state.get('cells');
  let key = findCellKey(state, cellId);

  return state.set('cells', cells.delete(key));
}

function moveCellDown(state, cellId) {
  let cell;
  let nextCell;
  let cells = state.get('cells');
  let key = findCellKey(state, cellId);

  // cannot move lower than last
  if (key === (cells.size - 1)) {
    return state;
  }

  cell = cells.get(key);
  nextCell = cells.get(key + 1);

  let newCells = cells.set(key, nextCell).set(key + 1, cell);
  return state.set('cells', newCells);
}

function moveCellUp(state, cellId) {
  let cell;
  let nextCell;
  let cells = state.get('cells');
  let key = findCellKey(state, cellId);

  // cannot move higher than first position
  if (key === 0) {
    return state;
  }

  cell = cells.get(key);
  nextCell = cells.get(key - 1);

  let newCells = cells.set(key, nextCell).set(key - 1, cell);
  return state.set('cells', newCells);
}

/**
 * Iterates over the cells and returns the key
 * for the given cell id or undefined.
 */
function findCellKey(state, cellId) {
  let cells = state.get('cells');
  let key = cells.findKey(e => {
    return e.get('id') === cellId;
  });

  return key;
}

/**
 * Changes the active block (current cell in edit mode)
 */
function changeActiveBlock(state, cellId) {
  return state.set('activeBlock', cellId);
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

function updateNotebookMetadata(state, name, value) {
  switch(name) {
    case 'slug':
      return state.set('slug', value);
    case 'title':
    case 'author':
      return state.setIn(['metadata', name], value);
    default:
      return state;
  }
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
