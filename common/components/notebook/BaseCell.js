import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import { editCell, deleteCell, stopEditCell, moveCellUp, moveCellDown, toggleCellVisibility } from '../../actions/NotebookActions';

import { sourceFromCell } from '../../util/nbUtil';

/**
 * Base cell component, that handles common cell operations
 *
 * @export
 * @class CellBase
 * @extends {React.Component}
 */
export default class BaseCell extends React.Component {
  constructor(props) {
    super(props);

    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onStopEdit = this.onStopEdit.bind(this);
    this.onUpdateCell = this.onUpdateCell.bind(this);
    this.onCellUp = this.onCellUp.bind(this);
    this.onCellDown = this.onCellDown.bind(this);
    this.onToggleVisibility = this.onToggleVisibility.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.fastShouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Call onUpdateCell, when the component state is changing, e.g. caused by clicking on another cell to edit
    if (this.props.editing === true && nextProps.editing === false) {
      this.onUpdateCell();
    }

    return this.fastShouldComponentUpdate(nextProps, nextState);
  }


  onToggleVisibility() {

    if (this.onUpdateCell) {
      // Save the current session, otherwise it will be overridden
      this.onUpdateCell();
    }

    this.props.dispatch(toggleCellVisibility(this.props.cell.get('id')));
  }

  onCellUp() {
    this.props.dispatch(moveCellUp(this.props.cellIndex));
  }

  onCellDown() {
    this.props.dispatch(moveCellDown(this.props.cellIndex));
  }

  onEdit(e) {
    e.preventDefault();
    this.props.dispatch(editCell(this.props.cellIndex));
  }

  onDelete(e) {
    e.preventDefault();
    this.props.dispatch(deleteCell(this.props.cellIndex));
  }

  onStopEdit(e) {
    if (e) {
      e.preventDefault();
    }

    this.props.dispatch(stopEditCell());
    this.onUpdateCell();
  }

  // Dummpy impl.
  onUpdateCell() {
    // Do nothing
  }

  /**
   * Check for Ctrl+S and try to save the document if possible
   */
  onKeyDown(e) {
    let key = e.which || e.keyCode;
    if (key === 27) {
      // Escape Key pressed
      this.onStopEdit();
    }
  }

  getSourceFromCell() {
    return sourceFromCell(this.props.cell);
  }

  isVisible() {
    return this.props.cell.getIn(['metadata', 'isVisible'], true);
  }

  render() {
    throw new Error('CellBase is an abstract component');
  }
}

BaseCell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  isEditModeActive: React.PropTypes.bool.isRequired, // shows edit icons and actions, e.g. adding new cells
  editing: React.PropTypes.bool.isRequired, // current cell is active for editing
  cellIndex: React.PropTypes.number.isRequired,
  course: React.PropTypes.string
};

BaseCell.MAX_EDITOR_HEIGHT = 400;

BaseCell.contextTypes = {
  messageList: React.PropTypes.object
};