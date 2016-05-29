import Immutable from 'immutable';

/**
 * Returns the source of a cell as one string
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

export function loadCellsFromIPYNB(ipynb) {
  let result = {
    cells: [],
    language: null
  };

  try {
    ipynb = JSON.parse(ipynb);
    console.info(ipynb);

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
    console.log(e);
  }

  return result;
}