import React from 'react';

import Icon from '../icon';
import {Nav, NavItem, NavDropdown, DropdownItem, DropdownDivider} from '../bootstrap';

class Tab extends React.Component {
  render() {
    return (
      <NavItem onClick={this.props.onClick} active={this.props.active}>
        <Icon name={this.props.type}/> {this.props.title}
      </NavItem>
    );
  }
}

export default class TabBar extends React.Component {
  onNewFile() {
    let name = prompt('Name?');

    if (name && this.props.onNewFile) {
      this.props.onNewFile(name);
    }
  }

  onNewTerminal(e) {
    e.preventDefault();
    if (this.props.onNewTerminal) {
      this.props.onNewTerminal();
    }
  }

  onChange(type, index, e) {
    e.preventDefault();
    e.target.blur();

    if (this.props.onChange) {
      this.props.onChange(type, index);
    }
  }

  renderTabs(type, tabs) {
    return tabs.map((tab, index) => {
      return (
        <Tab
          type={type}
          key={type + index}
          title={tab.name}
          onClick={this.onChange.bind(this, type, index)}
          active={type === this.props.active.type && index === this.props.active.index}
        />
      );
    });
  }

  render() {
    return (
      <Nav bsStyle="pills">
        {this.renderTabs('file', this.props.files)}
        {this.renderTabs('terminal', this.props.terminals)}

        <NavDropdown title={<Icon name="bars"/>} right>
          <DropdownItem onClick={this.onNewFile.bind(this)}>
            <Icon name="file" fixedWidth/> Neue Datei
          </DropdownItem>
          <DropdownItem onClick={this.onNewTerminal.bind(this)}>
            <Icon name="terminal" fixedWidth/> Neues Terminal
          </DropdownItem>

          <DropdownDivider/>

          <DropdownItem>
            <Icon name="refresh" fixedWidth/> Neu laden
          </DropdownItem>
          <DropdownItem>
            <Icon name="download" fixedWidth/> Exportieren
          </DropdownItem>
          <DropdownItem>
            <Icon name="upload" fixedWidth/> Importieren
          </DropdownItem>

          <DropdownDivider/>

          <DropdownItem>
            <Icon name="gear" fixedWidth/> Einstellungen
          </DropdownItem>
        </NavDropdown>
      </Nav>
    );
  }
}
