import React from 'react';
import Ace from 'ace';

import {Input} from './bootstrap';

export default class Options extends React.Component {
  componentWillMount() {
    this.themes = Ace.require('ace/ext/themelist').themes;
  }

  onChange(event) {
    let target = event.target;

    if (this.props.onChange) {
      let value;
      if (target.type === 'checkbox') {
        value = target.checked;
      } else {
        value = target.value;
      }

      this.props.onChange(target.name, value);
    }
  }

  render() {
    let themes = this.themes.reduce((themes, theme) => {
      let group = theme.isDark ? themes.dark : themes.light;
      group.push(<option key={theme.name} value={theme.theme}>{theme.caption}</option>);
      return themes;
    }, { light: [], dark: [] });

    let options = this.props.options;

    let cols = {
      className: 'col-sm-4',
      labelClassName: 'col-sm-3'
    };

    return (
      <div>
        <h2>Einstellungen</h2>
        <form className="options" onChange={this.onChange.bind(this)} onSubmit={e => e.preventDefault()}>
          <Input type="select" label="Farbschema" name="theme" value={options.theme} {...cols}>
            <optgroup label="Hell">{themes.light}</optgroup>
            <optgroup label="Dunkel">{themes.dark}</optgroup>
          </Input>
          <Input label="Schriftgröße" type="number" min="6" max="50" step="1" name='fontSize' value={options.fontSize} {...cols}/>
          <Input label="Unsichtbare Zeichen anzeigen" type="checkbox" name='showInvisibles' checked={options.showInvisibles} {...cols}/>
          <Input label="Aktive Zeile hervorheben" type="checkbox" name='highlightActiveLine' checked={options.highlightActiveLine} {...cols}/>
        </form>
      </div>
    );
  }
}

Options.propTypes = {
  onChange: React.PropTypes.func,
  options: React.PropTypes.object
};
