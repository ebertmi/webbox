import React from 'react';
import Slug from 'speakingurl';
import clone from 'lodash/clone';
import set from 'lodash/set';

import { Button, Input } from '../../bootstrap';
import { EmbedTypes } from '../../../constants/Embed';
import TaggedInput from '../../TaggedInput';

/**
 * Displays and allows to change embed attributes.
 *
 * @export
 * @class AttributePanel
 * @extends {React.Component}
 */
export default class AttributePanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      embed: this.cloneFromProps(),
      isDirty: false,
      creators: []
    };

    this.onSave = this.onSave.bind(this);
    this.onReset = this.onReset.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onReload = this.onReload.bind(this);
    this.handleCreatorChange = this.handleCreatorChange.bind(this);
  }

  /**
   * Delets the embed after confirmation by the user.
   *
   * @param {any} e - event
   * @returns {undefined}
   */
  onDelete(e) {
    e.preventDefault();

    this.props.item.deleteEmbed();
  }

  /**
   * Generic input value to state handler
   *
   * @param {string} [path=['embed']] Path of the value to set
   * @param {any} event The change event including the target and its value
   * @returns {undefined}
   */
  onChangeOption(path=['embed'], event) {
    let target = event.target;
    let value;
    let name = target.name;

    switch (target.type) {
      case 'checkbox':
        value = target.checked;
        break;
      case 'number':
        value = +target.value;
        break;
      default:
        value = target.value;
    }

    // Special slug handling
    if (name === 'slug') {
      if (value.endsWith('-')) {
        value = Slug(value) + '-';
      } else {
        value = Slug(value);
      }
    }

    // Set new value on the path
    let newState = clone(this.state);
    set(newState, path.concat(name), value);
    this.setState(newState);
  }

  /**
   * Saves the changes. It requires a reload, so that all changes are really made.
   *
   * @param {any} e React event
   * @returns {undefined}
   */
  onSave(e) {
    e.preventDefault();
    this.props.item.updateEmbed(this.state.embed);
  }

  /**
   * Resets the state to the original embed data
   *
   * @param {any} e React event
   * @returns {undefined}
   */
  onReset(e) {
    e.preventDefault();

    this.setState({
      embed: this.cloneFromProps()
    });
  }

  onBeforeCreatorAdded (value) {
    // ToDo: check if e-mail does exist
  }

  onReload(e) {
    e.preventDefault();

    location.reload();
  }

  handleCreatorChange (creator, creators) {
    const newState = clone(this.state.embed);
    newState.creators = creators;

    this.setState({
      isDirty: true,
      embed: newState
    });
  }

  /**
   * Clone the current project.data object.
   *
   * @returns {object} cloned (shallow) embed object
   */
  cloneFromProps() {
    const clonedEmbed = clone(this.props.item.projectData.embed);
    clonedEmbed.creators = clonedEmbed.creators.map(c => c.email);
    return clonedEmbed;
  }

  // ToDo:
  renderAssets() {

  }

  render() {
    let embed = this.state.embed;
    let slug = embed.slug != null ? embed.slug : '';

    return (
      <form className="options-panel" onSubmit={e => e.preventDefault()}>
        <legend>Allgemeine Eigenschaften</legend>
        <Input label="Kurzlink" type="text" name="slug" value={slug} onChange={this.onChangeOption.bind(this, ['embed'])} muted="Sie können hier einen mehrere Wörter (a-Z und -, aber keine Leerzeichen) definieren. Damit können Sie über einen lesbaren Link auf dieses Beispiel zugreifen. Es werden automatisch Zeichen entfernt bzw. ersetzt!" />
        <hr/>
        <legend>Metadaten</legend>
        <div className="form-group">
          <label className="form-control-label">Sprache/Typ</label>
          <select className="form-control" name="language" onChange={this.onChangeOption.bind(this, ['embed', 'meta'])} value={embed.meta.language}>
            <option value="python3">Python 3</option>
            <option value="python2">Python 2</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>
          <small className="text-muted">Spezifiziert die zu verwendente Sprache für das Beispiel. <code>python3</code> für Python3 und <code>python</code> für Python 2</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Name</label>
          <input className="form-control" type="text" placeholder="z. B. String Methoden" name="name" onChange={this.onChangeOption.bind(this, ['embed', 'meta'])} value={embed.meta.name}/>
          <small className="text-muted">Name, der das Beispiel beschreibt. Dieser wird oben rechts angezeigt.</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Typ</label>
          <select className="form-control" name="embedType" onChange={this.onChangeOption.bind(this, ['embed', 'meta'])} value={embed.meta.embedType}>
            <option value={EmbedTypes.Sourcebox}>Sourcebox (serverseitig)</option>
            <option value={EmbedTypes.Skulpt}>Skulpt (clientseitig, nur Python)</option>
          </select>
          <small className="text-muted">Der Typ eines Beispiels definiert mit welchem Mechanismus der Code ausgeführt wird. <em>sourcebox</em> wird serverseitig ausgeführt. <em>skulpt</em> erlaubt die clientseitige Ausführung von Python (3).</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Main-File</label>
          <input className="form-control" type="text" placeholder="main.py" name="mainFile" onChange={this.onChangeOption.bind(this, ['embed', 'meta'])} value={embed.meta.mainFile}/>
          <small className="text-muted">Datei, die zum Ausführen verwendet werden soll. Hat nur Auswirkungen auf bestimmte Sprache wie z.B. Python.</small>
        </div>
        <div className="form-group">
          <label className="form-control-label" >Interne ID</label>
          <input className="form-control" disabled readOnly type="text" defaultValue={embed.id} name="id" />
          <small>Interne ID des Dokumentes.</small>
        </div>
        <div className="form-group">
          <label className="form-control-label" >Besitzer</label>
          {<TaggedInput onAddTag={this.handleCreatorChange} onRemoveTag={this.handleCreatorChange} name="creators" placeholder="Besitzer" tags={embed.creators} />}
          {/*<input className="form-control" type="text" defaultValue={embed.creators.map(e => e.email).join(', ')} readOnly disabled name="creators" />*/}
          <small>Fügen Sie weitere Benutzer (E-Mail) zu diesem Beispiel hinzu, um ihnen den Zugriff auf die Statistiken und Eigenschaften zu gewähren. Besitzer ändern anschließend immer nur das Grundbeispiel.</small>
        </div>
        <Button bsStyle="success" className="form-group" onClick={this.onSave}>Speichern</Button>
        <Button bsStyle="warn" className="form-group" onClick={this.onReset}>Zurücksetzen</Button>
        <div className="form-group">
          <p className="text-muted">Die Änderungen werden erst nach erneutem Laden des Beispiels wirksam. Drücken Sie nach dem Speichern die F5-Taste oder das Refresh-Symbol ihres Browsers. Alternativ können Sie <a onClick={this.onReload}>hier</a> zum erneutem Laden klicken.</p>
        </div>
        <hr />
        <Button bsStyle="danger" className="form-group" onClick={this.onDelete}>Löschen</Button>
        <div className="form-group">
          <p className="text-muted">Es werden auch alle gespeicherten Dokumente anderer Benutzer gelöscht.</p>
        </div>
      </form>
    );
  }
}
