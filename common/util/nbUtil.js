import Immutable from 'immutable';
import UUID from 'uuid';
import { addCellWithIndex, initialState } from '../reducers/notebook/notebookReducer';
import { CellTypes } from '../constants/NotebookConstants';

export function getCodeEmbedsFromNotebook(notebookImmutable) {
  const cells = notebookImmutable.get('cells');
  const embeds = cells.filter(cell => cell.get('cell_type') === CellTypes.CodeEmbed);

  return embeds;
}

/**
 * Replaces the current URL either with the id or the new slug
 * Uses history.replaceState to avoid browser refresh
 * @export
 * @param {any} id - document id
 * @param {any} slug - slug that replaces the id in the url
 * @returns {undefined}
 */
export function replaceIdWithSlug(id, slug) {
  // avoid renaming on course pages
  if (window.location.pathname.includes('/course/')) {
    return;
  }

  if (slug == null || slug == '') {
    window.history.replaceState({}, document.title, id);
  } else {
    window.history.replaceState({}, document.title, slug);
  }
}

export function notebookMetadataToSourceboxLanguage(metadata) {
  const languageName = metadata.getIn(['language_info', 'name'], 'python');
  const languageVersion = metadata.getIn(['language_info', 'version'], '3');

  return {
    executionLanguage: `${languageName}${languageVersion}`,
    languageName,
    languageVersion
  };
}

/**
 * Returns the source of a cell as one string and may combine multiple entries e.g. an array of strings
 * @param {String|Array|Immutable.List} cell - cell with content
 * @returns {String} content as a single string
 */
export function sourceFromCell(cell) {
  if (!cell) {
    return null;
  }

  // ToDo: should make a check here? Immutable.Js
  let source = cell.get('source');

  if (source instanceof Immutable.List) {
    source = source.toJS();
  }

  // split multiline strings
  if (Array.isArray(source)) {
    source = source.join('');
  }

  return source;
}

/**
 * Transform the state to a JavaScript object for persisting this on the database
 * 
 * @param {Immutable.Map} state - immutable state to transform
 * @returns {Object} transformed mutable javascript object
 */
export function stateToJS(state) {
  const document = {
    metadata: {},
    cells: []
  };

  const cells = state.get('cells');
  const cellOrder = state.get('cellOrder');

  // create a array of JavaScript cell objects
  cellOrder.map(cellId => {
    const cell = cells.get(cellId);
    document.cells.push(cell.toJS()); // pushed converted JS cell object
  });

  // save metadata
  document.metadata = state.get('metadata').toJS();

  document.authors = state.get('authors').toJS();
  document.slug = state.get('slug');
  document.nbformat = state.get('nbformat');
  document.nbformat_minor = state.get('nbformat_minor');
  document.course = state.get('course');
  document.id = state.get('id');

  return document;
}

/**
 * Transforms a document (JavaScript Object) into a Immutable State object:
 *  -> All cells are added to a Immutable.Map using the cell.id as a key
 *  -> For storing the order of cells we use a Immutable.List "cellOrder"" - containing a mapping of index:key
 *  -> "isAuthor" manages the overall switching between edit and view mode
 * 
 * @param {object} document - document as javascript object
 * @returns {undefined}
 */
export function documentToState(document) {
  let newState = initialState.set('metadata', Immutable.fromJS(document.metadata));

  newState = newState.set('slug', document.slug);
  newState = newState.set('nbformat', document.nbformat || 4);
  newState = newState.set('nbformat_minor', document.nbformat_minor || 0);
  newState = newState.set('course', document.course);
  newState = newState.set('authors', new Immutable.List(document.authors));
  newState = newState.set('embedType', document.embedType);

  // ToDo: We should really rename the isAuthor thing and then just call it isNotebookEditable
  //newState = newState.set('isAuthor', false/*document.isAuthor*/);

  // ToDo: This should be the real isAuthor key
  newState = newState.set('isAuthor', document.isAuthor);
  newState = newState.set('id', document.id);

  // now add cells
  for (const cell of document.cells) {
    // Check for missing id
    if (!cell.id) {
      cell.id = UUID.v4();
    }

    const res = addCellWithIndex(newState, null, Immutable.fromJS(cell));
    newState = res.state;
  }

  return newState;
}

export function loadCellsFromIPYNB(ipynb) {
  const result = {
    cells: [],
    language: null
  };

  try {
    ipynb = JSON.parse(ipynb);

    if (ipynb.metadata && ipynb.metadata.kernelspec) {
      result.language = ipynb.metadata.kernelspec.language;
    }

    if (ipynb.nbformat === 4) {
      result.cells = ipynb.cells;
    }

    if (ipynb.nbformat === 3 && ipynb.worksheets && ipynb.worksheets.length > 0) {
      result.cells = ipynb.worksheets[0].cells;
    }

    if (!result.cells) {
      result.cells = [];
    }

  } catch (e) {
    return new Error('Konnte Datei nicht lesen. Ungültiges Dateiformat.');
  }

  return result;
}

/**
 * Tries to copy the text or the text from the "fromElement" to the clipboard.
 *
 * @export
 * @param {any} fromElement - element to get the text from
 * @param {any} text - given text
 * @returns {undefined}
 */
export function copyText (fromElement, text) {
  function selectElementText (element) {
    if (document.selection) {
      const range = document.body.createTextRange();
      range.moveToElementText(element);
      range.select();
    } else if (window.getSelection) {
      const range = document.createRange();
      range.selectNode(element);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
  }

  function clearSelection () {
    if ( document.selection ) {
      document.selection.empty();
    } else if ( window.getSelection ) {
      window.getSelection().removeAllRanges();
    }
  }

  let element = fromElement;

  // Check if element is set, otherwise create a new one and set the textContent
  if (!fromElement) {
    element = document.createElement('DIV');
    element.textContent = text;
    document.body.appendChild(element);
  }

  // Select all of the text in the element
  selectElementText(element);

  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch (e) {
    // unsupported -> Safari
    console.warn('Copy Text not supported in this browser.');
  }

  // Delete only our dummy element, not a real one
  if (!fromElement) {
    element.remove();
  }

  clearSelection();

  return succeeded;
}
