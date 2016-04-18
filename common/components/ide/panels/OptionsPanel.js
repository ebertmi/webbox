import React from 'react';
import Ace from 'ace';

import set from 'lodash/set';

import {Button, Input} from '../../bootstrap';

import optionManager from '../../../models/options';

const themeList = Ace.require('ace/ext/themelist');

export default class OptionsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeOption = this.onChangeOption.bind(this);
  }

  componentWillMount() {
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

  renderAceOptions() {
    let options = this.state.options.ace;

    let themes = themeList.themes.reduce((themes, theme) => {
      let group = theme.isDark ? themes.dark : themes.light;
      group.push(<option key={theme.name} value={theme.theme}>{theme.caption}</option>);
      return themes;
    }, { light: [], dark: [] });

    return (
      <div onChange={this.onChange.bind(this, ['ace'])}>
        <legend>Editor</legend>
        <Input type="select" label="Farbschema" name="theme" value={options.theme}>
          <optgroup label="Hell">{themes.light}</optgroup>
          <optgroup label="Dunkel">{themes.dark}</optgroup>
        </Input>
        <Input label="Aktive Zeile hervorheben" type="checkbox" name="highlightActiveLine" checked={options.highlightActiveLine}/>
        <Input label="Ausgewähltes Wort hervorheben" type="checkbox" name="highlightSelectedWord" checked={options.highlightSelectedWord}/>
        <Input label="Unsichtbare Zeichen anzeigen" type="checkbox" name="showInvisibles" checked={options.showInvisibles}/>
        <Input label="Einrückung anzeigen" type="checkbox" name="displayIndentGuides" checked={options.displayIndentGuides}/>
        <Input label="Zeilen umbrechen" type="checkbox" name="wrap" checked={options.wrap}/>
      </div>
    );
  }

  renderTerminalOptions() {
    let options = this.state.options.terminal;

    return (
      <div onChange={this.onChange.bind(this, ['terminal'])}>
        <legend>Terminal</legend>
        <Input label="Akustisches Signal" type="checkbox" name="audibleBell" checked={options.audibleBell}/>
      </div>
    );
  }

  render() {
    let options = this.state.options;

    return (
      <form className="options-panel" onChange={this.onChange.bind(this, [])} onSubmit={e => e.preventDefault()}>
        <legend>Allgemeine Einstellungen</legend>
        <Input label="Schriftart" type="text" name='font' value={options.font}/>
        <Input label="Schriftgröße" type="number" min="1" max="50" step="1" name='fontSize' value={options.fontSize}/>
        {this.renderAceOptions()}
        {this.renderTerminalOptions()}
        <hr/>
        <Button bsStyle="danger" className="form-group" onClick={this.onReset.bind(this)}>Alle Einstellungen zurücksetzen</Button>
      </form>
    );
  }
}
