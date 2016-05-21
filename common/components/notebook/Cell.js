import React from 'react';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class Cell extends React.Component {
  constructor(props) {
    super(props);

    this.onEnterEdit = this.onEnterEdit.bind(this);
    this.onMoveCellUp = this.onMoveCellUp.bind(this);
    this.onMoveCellDown = this.onMoveCellDown.bind(this);
    this.onDeleteCell = this.onDeleteCell.bind(this);
    this.onSourceChanged = this.onSourceChanged.bind(this);
    this.getButtons = this.getButtons.bind(this);
  }

  componentDidMount() {
  }

  onMoveCellUp() {

  }

  onMoveCellDown() {

  }

  onDeleteCell() {

  }

  getButtons() {

  }

  onSourceChanged() {

  }

  onEnterEdit() {

  }

  renderEdit() {
    throw new Error('Implement this method in sublcass');
  }

  renderView() {
    throw new Error('Implement this method in sublcass');
  }

  render() {
    return (
      <div className="cell">
        {this.props.notebook.}
      </div>
    );
  }
}
