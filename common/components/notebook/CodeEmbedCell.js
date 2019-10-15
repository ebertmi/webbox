import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Autosuggest from 'react-autosuggest';

import BaseCell from './BaseCell';
import { EditButtonGroup } from './EditButtonGroup';
import CellMetadata from './CellMetadata';
import { updateCell } from '../../actions/NotebookActions';
import { EmbedTypes } from '../../constants/Embed';
import { API } from '../../services';
import { Severity } from '../../models/severity';

import IdeWrapper from '../ide/IdeWrapper';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeEmbedCell extends BaseCell {
  constructor(props) {
    super(props);

    // Bind callbacks to right context (this)
    this.onShowCreateEmbed = this.onShowCreateEmbed.bind(this);
    this.onCancelCreateEmbed = this.onCancelCreateEmbed.bind(this);
    this.onFormDataChange = this.onFormDataChange.bind(this);
    this.onCreateEmbed = this.onCreateEmbed.bind(this);
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);

    this.state = {
      showCreateEmbed: false,
      formData: {
        language: 'python3',
        embedType: EmbedTypes.Sourcebox,
        name: ''
      },
      suggestions: [],
      message: ''
    };
  }

  /**
   * Show the embed creation form
   */
  onShowCreateEmbed(e) {
    e.preventDefault();
    this.setState({
      showCreateEmbed: true
    });
  }

  /**
   * Hide/Cancel the embed creation
   */
  onCancelCreateEmbed(e) {
    e.preventDefault();
    this.setState({
      showCreateEmbed: false
    });
  }

  /**
   * Handles changes on the form data
   */
  onFormDataChange(e) {
    const name = e.target.name;
    const value = e.target.value;
    const newFormData = {};
    newFormData[name] = value;
    const formData = Object.assign({}, this.state.formData, newFormData);

    this.setState({formData: formData});
  }

  shouldRenderEmbedSuggestions() {
    return true;
  }

  getSuggestionValue(suggestion) {
    if (suggestion.id) {
      return suggestion.id;
    } else {
      return suggestion;
    }
  }

  onSuggestionsFetchRequested(obj) {
    API.autocomplete.embeds(null, {search: obj.value}).then(resp => {
      if (resp.error) {
        console.error(resp.error);
      } else {
        this.setState({
          suggestions: resp.embedsInfo
        });
      }
    });
  }

  onSuggestionsClearRequested() {
    this.setState({ suggestions: [] });
  }

  renderSuggestion(suggestion) {
    return <span>{suggestion.meta.name}</span>;
  }

  /**
   * Callback for creating an embed!
   * 1. Get form data
   * 2. Send request to server
   * 3. If successful change current id to the returned one
   * 3. If failed, show message
   */
  onCreateEmbed(e) {
    e.preventDefault();
    API.embed.createEmbed({}, this.state.formData).then(res => {
      if (!res.error) {
        // Successfully created a new embed, now update the cell and hide the form
        this.props.dispatch(updateCell(this.props.cell.get('id'), res.id));
        this.setState({
          showCreateEmbed: false
        });
      } else {
        this.context.messageList.showMessage(Severity.Error, res.error);
      }
    }).catch(err => {
      this.context.messageList.showMessage(Severity.Error, err);
    });
  }

  onUpdateCell(e, update) {
    console.info(update);
    if (update != undefined) {
      const value = update.newValue; //e.target.value || '';
      this.props.dispatch(updateCell(this.props.cell.get('id'), value));
    } else if (this.sourceInput != null) {
      const value = this.sourceInput.value || '';
      this.props.dispatch(updateCell(this.props.cell.get('id'), value));
    }
  }

  renderCreateEmbed() {
    return (
      <div>
        <strong>Neues Beispiel erstellen</strong>
        <div className="form-group">
          <label className="form-control-label">Sprache/Typ</label>
          <select className="form-control" name="language" onChange={this.onFormDataChange} value={this.state.formData.language}>
            <option value="python3">Python 3</option>
            <option value="python2">Python 2</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>
          <small className="text-muted">Spezifiziert die zu verwendente Sprache für das Beispiel. <code>python3</code> für Python3 und <code>python</code> für Python 2</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Name</label>
          <input className="form-control" type="text" placeholder="z. B. String Methoden" name="name" onChange={this.onFormDataChange} value={this.state.formData.name}/>
          <small className="text-muted">Name, der das Beispiel beschreibt. Dieser wird oben rechts angezeigt.</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Typ</label>
          <select className="form-control" name="embedType" onChange={this.onFormDataChange} value={this.state.formData.embedType}>
            <option value="sourcebox">Sourcebox (serverseitig)</option>
            <option value="skulpt">Skulpt (clientseitig, nur Python)</option>
          </select>
          <small className="text-muted">Der Typ eines Beispiels definiert mit welchem Mechanismus der Code ausgeführt wird. <em>sourcebox</em> wird serverseitig ausgeführt. <em>skulpt</em> erlaubt die clientseitige Ausführung von Python (3).</small>
        </div>
        <div className="form-group">
          <button className="btn btn-success btn-sm m-r-1" onClick={this.onCreateEmbed}>Erstellen</button>
          <button onClick={this.onCancelCreateEmbed} className="btn btn-danger btn-sm">Abbrechen</button>
        </div>
      </div>
    );
  }

  renderCreateEmbedButton() {
    return (
      <div className="form-group">
        <button onClick={this.onShowCreateEmbed} className="btn btn-primary btn-sm">Neues Beispiel</button>
        <p className="text-muted">Sie können hier direkt ein neues (leeres) Beispiel anlegen. Die ID des neu erzeugten Beispiels wird hier gleich eingefügt.</p>
      </div>
    );
  }

  renderEditMode() {
    let source = this.getSourceFromCell();

    let createForm = this.state.showCreateEmbed ? this.renderCreateEmbed() : this.renderCreateEmbedButton();

    const inputProps = {
      placeholder: 'ID oder Slug eines Embeds, Sie können auch suchen',
      value: source,
      onChange: this.onUpdateCell,
      type: 'text',
      className: 'form-control',
      ref: ref => this.sourceInput = ref
    };

    return (
      // onKeyDown={this.onKeyDown}
      // ToDo: handle onUpdateCell differently, as this does not work for ESC to stop editing
      <div className="col-12">
        <strong>Codebeispiel-Einstellungen</strong>
        <p className="text-muted">Sie können die Größe (Höhe und Breite) über die Metadaten auch selbst steuern. Nutzen Sie dazu die Schlüssel <code>height</code> bzw. <code>width</code> und einen numerischen Wert (z.B. <code>500</code>) ohne Einheit.</p>
        <div className="form-group">
          <label className="form-control-label">Beispiel-ID</label>
          <Autosuggest suggestions={this.state.suggestions}
            shouldRenderSuggestions={this.shouldRenderEmbedSuggestions}
            getSuggestionValue={this.getSuggestionValue}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            renderSuggestion={this.renderSuggestion}
            inputProps={inputProps} />
          <p className="text-muted">Sie können hier direkt eine ID einfügen, oder ihre eigenen Beispiele durchsuchen. Ein Klick in das leere Feld, zeigt all Ihre Beispiele in einer Liste an.</p>
          {/*<input className="form-control" type="text" placeholder="ID..." onChange={this.onUpdateCell} value={source} ref={ref => this.sourceInput = ref}/>*/}
        </div>
        <hr className="top-sep" />
        { createForm }
        <hr className="top-sep" />
        <strong>Vorschau</strong>
      </div>
    );
  }

  render() {
    const { cell, isEditModeActive, editing, dispatch, className } = this.props;
    //const width = this.props.cell.getIn(['metadata', 'width']);
    const height = this.props.cell.getIn(['metadata', 'height']);
    let content;
    let metadata = <CellMetadata className="col-12" dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    let editingClass = editing ? ' editing' : '';
    const isVisible = this.isVisible();

    let source = this.getSourceFromCell();

    // Add check for empty source
    let wrapper = source !== '' ? <IdeWrapper className="col-12" height={height} codeID={source} /> : <p>Keine ID angegeben.</p>;

    if (!(isEditModeActive && editing)) {
      content = null;
    } else {
      content = this.renderEditMode();
    }

    const classes = classnames(`codeembed-cell col-12 row ${className}`, editingClass, {
      'cell-not-visible': !isVisible
    });

    return (
      <div className={classes}>
        <EditButtonGroup isVisible={isVisible} isEditModeActive={isEditModeActive} editing={editing} onToggleVisibility={this.onToggleVisibility} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
        {wrapper}
      </div>
    );
  }
}

CodeEmbedCell.propTypes = {
  cell: PropTypes.object.isRequired,
  isEditModeActive: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  lazy: PropTypes.bool,
  cellIndex: PropTypes.number.isRequired
};

CodeEmbedCell.defaultProps = {
  lazy: true
};
