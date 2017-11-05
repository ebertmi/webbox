import React from 'react';
import set from 'lodash/set';

import {Button, Input} from '../../bootstrap';
import optionManager from '../../../models/options';

const themeList = {themes: ['vs', 'vs-dark', 'hc-black']};

export default class OptionsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeOption = this.onChangeOption.bind(this);

    this.state = {
      options: optionManager.getOptions()
    };
  }

  componentDidMount() {
    optionManager.on('change', this.onChangeOption);
    this.onChangeOption();
  }

  componentWillUnmount() {
    optionManager.removeListener('change', this.onChangeOption);
  }

  onChangeOption() {
    this.setState({
      options: optionManager.getOptions()
    });
  }

  onChange(path=[], e) {
    e.stopPropagation();

    let target = e.target;
    let value;

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

    let options = set({}, path.concat(target.name), value);
    optionManager.setOptions(options);
  }

  onReset(e) {
    e.preventDefault();
    e.stopPropagation();

    // maybe ask for confirmation

    optionManager.reset();
  }

  renderEditorOptions() {
    let options = this.state.options.editor;

    let themes = themeList.themes.map((theme) => {
      return <option key={theme} value={theme}>{theme}</option>;
    });

    const wrapOptions = [
      <option key="wordWrap-on" value="on">An</option>,
      <option key="wordWrap-off" value="off">Aus</option>
    ];

    const whitespaceOptions = [
      <option key="wordWrap-none" value="none">Keine</option>,
      <option key="wordWrap-boundary" value="boundary">Zeilenanfang und -ende</option>,
      <option key="wordWrap-all" value="all">Alle</option>
    ];

    const lineHighlightOptions = [
      <option key="wordWrap-none" value="none">Keine</option>,
      <option key="wordWrap-gutter" value="gutter">In der linken Leiste (Gutter)</option>,
      <option key="wordWrap-line" value="line">Zeile</option>,
      <option key="wordWrap-all" value="all">Leiste + Zeile</option>
    ];

    return (
      <div onChange={this.onChange.bind(this, ['editor'])}>
        <legend>Editor</legend>
        <Input type="select" label="Farbschema" name="theme" defaultValue={options.theme}>
          {themes}
        </Input>
        <Input type="select" label="Aktive Zeile hervorheben" name="renderLineHighlight" defaultValue={options.renderLineHighlight}>
          {lineHighlightOptions}
        </Input>
        <Input label="Ausgewähltes Wort hervorheben" type="checkbox" name="selectionHighlight" defaultChecked={options.selectionHighlight}/>
        <Input type="select" label="Unsichtbare Zeichen anzeigen" name="renderWhitespace" defaultValue={options.renderWhitespace}>
          {whitespaceOptions}
        </Input>
        <Input label="Einrückung anzeigen" type="checkbox" name="renderIndentGuides" defaultChecked={options.renderIndentGuides}/>
        <Input type="select" label="Zeilen umbrechen" name="wordWrap" defaultValue={options.wordWrap}>
          {wrapOptions}
        </Input>
        <Input label="Autovervollständigung bei Klammern" type="checkbox" name="autoClosingBrackets" defaultChecked={options.autoClosingBrackets}/>
      </div>
    );
  }

  renderTerminalOptions() {
    let options = this.state.options.terminal;

    return (
      <div onChange={this.onChange.bind(this, ['terminal'])}>
        <legend>Terminal</legend>
        <Input label="Akustisches Signal" type="checkbox" name="audibleBell" defaultChecked={options.audibleBell}/>
      </div>
    );
  }

  render() {
    let options = this.state.options;

    return (
      <form className="options-panel" onChange={this.onChange.bind(this, [])} onSubmit={e => e.preventDefault()}>
        <legend>Allgemeine Einstellungen</legend>
        <Input label="Schriftart" type="text" name='font' defaultValue={options.font}/>
        <Input label="Schriftgröße" type="number" min="1" max="50" step="1" name='fontSize' defaultValue={options.fontSize}/>
        {this.renderEditorOptions()}
        {this.renderTerminalOptions()}
        <hr/>
        <Button bsStyle="danger" className="form-group" onClick={this.onReset.bind(this)}>Alle Einstellungen zurücksetzen</Button>
      </form>
    );
  }
}
