import cloneDeep from 'lodash/cloneDeep';

export const ImageItem = {
  openWith: '![](',
  closeWith: ')',
  multiline: false,
  placeHolder: 'Bild-URL',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: '',
  type: 'image'
};

export const ItalicsItem = {
  openWith: '*',
  closeWith: '*',
  multiline: false,
  placeHolder: '',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: '',
  canUndo: true,
  type: 'italic'
};

export const BoldItem = {
  openWith: '**',
  closeWith: '**',
  multiline: false,
  placeHolder: '',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: '',
  canUndo: true,
  type: 'bold'
};

export const UlItem = {
  openWith: '* ',
  closeWith: '',
  multiline: true,
  placeHolder: '',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: '',
  canUndo: true,
  type: 'ul'
};

export const OlItem = {
  openWith: '. ',
  closeWith: '',
  multiline: true,
  prependLineNumbers: true,
  placeHolder: '',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: '',
  canUndo: false,
  type: 'ol'
};

export const LinkItem = {
  openWith: '[',
  closeWith: ']()',
  multiline: false,
  placeHolder: 'Linktext',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: '',
  canUndo: true,
  type: 'link'
};

export const BlockquoteItem = {
  openWith: '> ',
  closeWith: '',
  multiline: false,
  placeHolder: ' Zitat',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: '',
  canUndo: true,
  type: 'blockquote'
};

export const InlineCodeItem = {
  openWith: '`',
  closeWith: '`',
  multiline: false,
  placeHolder: 'Code',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: '',
  canUndo: true,
  type: 'inlinecode'
};

export const CodeBlockItem = {
  openWith: '',
  closeWith: '',
  multiline: true,
  placeHolder: 'Codeblock',
  replaceWith: '',
  openBlockWith: '\n```Sprache\n',
  closeBlockWith: '\n```\n',
  canUndo: false,
  type: 'codeblock'
};

export const ExtendedFormat = '<!-- {} -->';

/**
 * Inserts the item in the monaco editor model.
 *
 * @export
 * @param {Object} item - item to insert
 * @param {Monaco.IModel} model - model to use
 * @param {Monaco.IStandaloneEditor} editor - editor instance to use
 * @returns {void}
 */
export function insert(item, model, editor) {
  let str;
  let lineNumber = 1;
  const clonedItem = cloneDeep(item); // Clone Item to prevent object manipulation
  const range = editor.getSelection();
  let selection = model.getValueInRange(range);

  const openBlockWith = clonedItem.openBlockWith;
  const closeBlockWith = clonedItem.closeBlockWith;

  // If item is multiline and user has selected something
  if (clonedItem.multiline === true && selection) {
    const lines = selection.split(/\r?\n/);

    for (let l = 0; l < lines.length; l++) {
      lineNumber = l + 1;
      lines[l] = buildBlock(lines[l], clonedItem, lineNumber).block;
    }

    selection = lines.join('\n');

    // Reset open and close
    clonedItem.openWith = '';
    clonedItem.closeWith = '';
    clonedItem.prependLineNumbers = false;
  }

  str = buildBlock(selection, clonedItem, lineNumber);

  str.block = openBlockWith + str.block + closeBlockWith;
  str.openBlockWith = openBlockWith;
  str.closeBlockWith = closeBlockWith;

  doInsert(str, model, editor);
}

/**
 * Append the given string at the end of the current line (cursor position)
 *
 * @export
 * @param {String} str - string to insert
 * @param {Monaco.IModel} model - session to use
 * @param {Monaco.IStandaloneEditor} editor - session to use
 * @returns {void}
 */
export function appendAtEndOfLine(str, model, editor) {
  const range = editor.getSelection();
  const currline = range.positionLineNumber;
  const wholelinetext = model.getLineContent(currline);
  const lineLength = wholelinetext != null ? wholelinetext.length : 0;

  const endCol = lineLength + 1;
  const editOps = [{
    forceMoveMarkers: true,
    identifier: 'insertMarkdown',
    range: {
      startLineNumber: currline,
      startColumn: endCol,
      endLineNumber: currline,
      endColumn: endCol
    },
    text: str
  }];

  model.pushEditOperations(range, editOps);
}

/**
 * Inserts the item in the edit session.
 *
 * @param {Object} strItem - string to insert
 * @param {Monaco.IModel} model - model to use
 * @param {Monaco.IStandaloneEditor} editor - editor instance
 * @returns {void}
 */
function doInsert(strItem, model, editor) {
  const range = editor.getSelection();

  const editOps = [{
    forceMoveMarkers: false,
    identifier: 'insertMarkdown',
    range: range,
    text: strItem.block
  }];

  model.pushEditOperations(range, editOps);
}

// ToDo: automatically remove markup if we trigger it again, e.g. **bold** back to bold
function buildBlock(str, item, lineNumber) {
  const multiline = item.multiline;
  let block;
  const openWith = `${item.prependLineNumbers ? lineNumber : ''}${item.openWith}`;

  if ((str === '' || item.type === ImageItem.type) && item.placeHolder !== '') {
    block = openWith + item.placeHolder + item.closeWith;
  } else {
    let lines = [str];
    const blocks = [];

    if (multiline === true) {
      lines = str.split(/\r?\n/);
    }

    // iterate over all lines
    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];
      const trailingSpaces = line.match(/ *$/);

      // Determine if we can undo the action if line has already same format
      if (item.canUndo && line.startsWith(openWith) && line.endsWith(item.closeWith)) {
        if (trailingSpaces) {
          blocks.push(line.slice(openWith.length, line.length-item.closeWith.length) + trailingSpaces);
        } else {
          blocks.push(line.slice(openWith.length, line.length-item.closeWith.length));
        }
      } else {
        // Normal formatting routine
        if (trailingSpaces) {
          blocks.push(openWith + line.replace(/ *$/g, '') + item.closeWith + trailingSpaces);
        } else {
          blocks.push(openWith + line + item.closeWith);
        }
      }
    }

    block = blocks.join('\n');
  }

  return {
    block: block,
    openWith: item.openWith,
    placeHolder: item.placeHolder,
    closeWith: item.closeWith
  };
}
