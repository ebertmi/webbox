import React from 'react';
import Slug from 'slug';
import clone from 'lodash/clone';
import set from 'lodash/set';

import {Button, Input} from '../../bootstrap';

Slug.defaults.mode = 'rfc3986';

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
      embed: this.cloneFromProps()
    };

    this.onSave = this.onSave.bind(this);
    this.onReset = this.onReset.bind(this);
  }

  /**
   * Clone the current project.data object.
   *
   * @returns cloned (shallow) embed object
   */
  cloneFromProps() {
    return clone(this.props.item.data);
  }

  /**
   * Generic input value to state handler
   *
   * @param {string} [path=['embed']] Path of the value to set
   * @param {any} event The change event including the target and its value
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
      value = Slug(value);
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
   */
  onSave(e) {
    e.preventDefault();
    this.props.item.updateEmbed(this.state.embed);
  }

  /**
   * Resets the state to the original embed data
   *
   * @param {any} e React event
   */
  onReset(e) {
    e.preventDefault();

    this.setState({
      embed: this.cloneFromProps()
    });
  }

  // ToDo:
  renderAssets() {

  }

  render() {
    let embed = this.state.embed;

    return (
      <form className="options-panel" onSubmit={e => e.preventDefault()}>
        <legend>Allgemeine Eigenschaften</legend>
        <Input label="Kurzlink" type="text" name="slug" value={embed.slug || ''} onChange={this.onChangeOption.bind(this, ['embed'])} muted="Sie können hier einen mehrere Wörter (a-Z und -, aber keine Leerzeichen) definieren. Damit können Sie über einen lesbaren Link auf dieses Beispiel zugreifen. Es werden automatisch Zeichen entfernt bzw. ersetzt!" />
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
          <input className="form-control" type="text" placeholer="z. B. String Methoden" name="name" onChange={this.onChangeOption.bind(this, ['embed', 'meta'])} value={embed.meta.name}/>
          <small className="text-muted">Name, der das Beispiel beschreibt. Dieser wird oben rechts angezeigt.</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Typ</label>
          <select className="form-control" name="embedType" onChange={this.onChangeOption.bind(this, ['embed', 'meta'])} value={embed.meta.embedType}>
            <option value="sourcebox">Sourcebox (serverseitig)</option>
            <option value="skulpt">Skulpt (clientseitig, nur Python)</option>
          </select>
          <small className="text-muted">Der Typ eines Beispiels definiert mit welchem Mechanismus der Code ausgeführt wird. <em>sourcebox</em> wird serverseitig ausgeführt. <em>skulpt</em> erlaubt die clientseitige Ausführung von Python (3).</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Main-File</label>
          <input className="form-control" type="text" placeholer="main.py" name="mainFile" onChange={this.onChangeOption.bind(this, ['embed', 'meta'])} value={embed.meta.mainFile}/>
          <small className="text-muted">Datei, die zum Ausführen verwendet werden soll.</small>
        </div>
        <Button bsStyle="success" className="form-group" onClick={this.onSave}>Speichern</Button>
        <Button bsStyle="danger" className="form-group" onClick={this.onReset}>Zurücksetzen</Button>
        <div className="form-group">
          <p className="text-muted">Die Änderungen werden erst nach erneutem Laden des Beispiels wirksam. Drücken Sie nach dem Speichern die F5-Taste oder das Refresh-Symbol ihres Browsers. Alternativ können Sie <a href="javascript:location.reload();">hier</a> zum erneutem Laden klicken.</p>
        </div>
      </form>
    );
  }
}
