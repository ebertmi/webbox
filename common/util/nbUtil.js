import Immutable from 'immutable';
import { addCellWithIndex, initialState } from '../reducers/notebook/notebookReducer';

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

/**
 * Transform the state to a JavaScript object for persisting this on the database
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
    let cell = cells.get(cellId);
    document.cells.push(cell.toJS()); // pushed converted JS cell object
  });

  // save metadata
  document.metadata = state.get('metadata').toJS();

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
 *  -> Add canToggleEditMode to allow authors to view the document in view mode
 */
export function documentToState(document) {
  let newState = initialState.set('metadata', Immutable.fromJS(document.metadata));

  newState = newState.set('slug', document.slug);
  newState = newState.set('nbformat', document.nbformat || 4);
  newState = newState.set('nbformat_minor', document.nbformat_minor || 0);
  newState = newState.set('course', document.course);
  newState = newState.set('authors', new Immutable.List(document.authors));
  newState = newState.set('isAuthor', document.isAuthor);
  newState = newState.set('canToggleEditMode', document.canToggleEditMode);
  newState = newState.set('id', document.id);

  // now add cells
  for (let cell of document.cells) {
    newState = addCellWithIndex(newState, null, Immutable.fromJS(cell));
  }

  return newState;
}

export function loadCellsFromIPYNB(ipynb) {
  let result = {
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
    console.log(e);
  }

  return result;
}

/**
 *http://about.asika.tw/fongshen-editor/
	Class.prototype.insert = function(button)
	{
		var self = this;

		var selection = this.editor.getSelection(),
			string;

		try
		{
			// callbacks before insertion
			this.trigger(self.options.beforeInsert, button);
			this.trigger(button.beforeInsert, button);

			var openBlockWith = this.trigger(button.openBlockWith, button);
			var closeBlockWith = this.trigger(button.closeBlockWith, button);

			// callbacks after insertion
			if (button.multiline === true)
			{
				this.trigger(button.beforeMultiInsert, button);
			}

			self.line = 1;

			if (button.multiline === true && selection)
			{
				var lines = selection.split(/\r?\n/);

				for (var l = 0; l < lines.length; l++)
				{
					self.line = l + 1;

					lines[l] = this.buildBlock(lines[l], button).block;
				}

				selection = lines.join("\n");

				button.openWith = null;
				button.closeWith = null;
			}

			string = this.buildBlock(selection, button);

			string.block = openBlockWith + string.block + closeBlockWith;
			string.openBlockWith = openBlockWith;
			string.closeBlockWith = closeBlockWith;

			this.doInsert(string);

			// callbacks after insertion
			if (button.multiline === true)
			{
				this.trigger(button.afterMultiInsert, button);
			}

			this.trigger(button.afterInsert, button);
			this.trigger(self.options.afterInsert, button);
		}
		catch (err)
		{
			console.log(err);
		}

		// refresh preview if opened
		if (self.options.previewContainer)
		{
			self.refreshPreview();
		}
	};


	Class.prototype.doInsert = function(string)
	{
		var self = this;

		var selection = this.editor.getSelection();

		if (selection)
		{
			this.editor.insert(string.block);
		}
		else
		{
			this.editor.insert(string.block);

			var backOffset = string.closeWith.length;

			this.editor.moveCursor(0, -backOffset);
		}
	};

prototype.buildBlock = function(string, button)
	{
		var self = this;

		var openWith = this.trigger(button.openWith, button);
		var placeHolder = this.trigger(button.placeHolder, button);
		var replaceWith = this.trigger(button.replaceWith, button);
		var closeWith = this.trigger(button.closeWith, button);
		var multiline = button.multiline;
		var block;

		if (replaceWith !== "")
		{
			block = openWith + replaceWith + closeWith;
		}
		else if (string === '' && placeHolder !== '')
		{
			block = openWith + placeHolder + closeWith;
		}
		else
		{
			var lines = [string], blocks = [];

			if (multiline === true)
			{
				lines = string.split(/\r?\n/);
			}

			for (var l = 0; l < lines.length; l++)
			{
				var line = lines[l];
				var trailingSpaces;

				if (trailingSpaces = line.match(/ *$/))
				{
					blocks.push(openWith + line.replace(/ *$/g, '') + closeWith + trailingSpaces);
				}
				else
				{
					blocks.push(openWith + line + closeWith);
				}
			}

			block = blocks.join("\n");
		}

		return {
			block: block,
			openWith: openWith,
			replaceWith: replaceWith,
			placeHolder: placeHolder,
			closeWith: closeWith
		};
	};
 */