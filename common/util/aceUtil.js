import cloneDeep from 'lodash/cloneDeep';

export const ImageItem = {
  openWith: '![](',
  closeWith: ')',
  multiline: false,
  placeHolder: 'Bild-URL',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: ''
};

export const ItalicsItem = {
  openWith: '*',
  closeWith: '*',
  multiline: false,
  placeHolder: '',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: ''
};

export const BoldItem = {
  openWith: '**',
  closeWith: '**',
  multiline: false,
  placeHolder: '',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: ''
};

export const UlItem = {
  openWith: '* ',
  closeWith: '',
  multiline: true,
  placeHolder: '',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: ''
};

export const OlItem = {
  openWith: '. ',
  closeWith: '',
  multiline: true,
  prependLineNumbers: true,
  placeHolder: '',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: ''
};

export const LinkItem = {
  openWith: '[',
  closeWith: ']()',
  multiline: false,
  placeHolder: 'Linktext',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: ''
};

export const BlockquoteItem = {
  openWith: '> ',
  closeWith: '',
  multiline: false,
  placeHolder: ' Zitat',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: ''
};

export const InlineCodeItem = {
  openWith: '`',
  closeWith: '`',
  multiline: false,
  placeHolder: 'Code',
  replaceWith: '',
  openBlockWith: '',
  closeBlockWith: ''
};

export const CodeBlockItem = {
  openWith: '',
  closeWith: '',
  multiline: true,
  placeHolder: 'Codeblock',
  replaceWith: '',
  openBlockWith: '\n```Sprache\n',
  closeBlockWith: '\n```\n'
};

export const ExtendedFormat = '<!-- {} -->';

/**
 * Inserts the item in the Ace Editor Session.
 *
 * @export
 * @param {Object} item - item to insert
 * @param {EditSession} session - session to use
 * @returns {void}
 */
export function insert(item, session) {
  let str;
  let lineNumber = 1;
  const clonedItem = cloneDeep(item); // Clone Item to prevent object manipulation

  let selection = session.doc.getTextRange(session.selection.getRange());
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

  doInsert(str, session);
}

/**
 * Append the given string at the end of the current line (cursor position)
 *
 * @export
 * @param {String} str - string to insert
 * @param {EditSession} session - session to use
 * @returns {void}
 */
export function appendAtEndOfLine(str, session) {
  const cursor = session.selection.getCursor();
  const currline = cursor.row;
  const wholelinetext = session.getLine(currline);
  const lineLength = wholelinetext != null ? wholelinetext.length : 0;

  cursor.column += lineLength;
  session.insert(cursor, str);
  const position = session.selection.getCursor();

  // Apply new position
  session.selection.moveCursorToPosition(position);
}

/**
 * Inserts the item in the edit session.
 *
 * @param {Object} strItem - string to insert
 * @param {EditSession} session - session to use
 * @returns {void}
 */
function doInsert(strItem, session) {
  const selection = session.doc.getTextRange(session.selection.getRange());

  if (selection) {
    session.replace(session.selection.getRange(), strItem.block);
  } else {
    session.insert(session.selection.getCursor(), strItem.block);

    const position = session.selection.getCursor();
    const backOffset = strItem.closeWith.length;

    // Alter position
    position.column -= backOffset;

    // Apply new position
    session.selection.moveCursorToPosition(position);
  }
}

function buildBlock(str, item, lineNumber) {
  const multiline = item.multiline;
  let block;
  const openWith = `${item.prependLineNumbers ? lineNumber : ''}${item.openWith}`;

  if (item.replaceWith !== '') {
    block = openWith + item.replaceWith + item.closeWith;
  } else if (str === '' && item.placeHolder !== '') {
    block = openWith + item.placeHolder + item.closeWith;
  } else {
    let lines = [str];
    const blocks = [];

    if (multiline === true) {
      lines = str.split(/\r?\n/);
    }

    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];
      const trailingSpaces = line.match(/ *$/);

      if (trailingSpaces) {
        blocks.push(openWith + line.replace(/ *$/g, '') + item.closeWith + trailingSpaces);
      } else {
        blocks.push(openWith + line + item.closeWith);
      }
    }

    block = blocks.join('\n');
  }

  return {
    block: block,
    openWith: item.openWith,
    replaceWith: item.replaceWith,
    placeHolder: item.placeHolder,
    closeWith: item.closeWith
  };
}
