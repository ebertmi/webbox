import React from 'react';

import Icon from '../Icon';
import {Nav, NavItem} from '../bootstrap';

import Menu from './Menu';

import Tab from './tabs/Tab';
import FileTab from './tabs/FileTab';
import ProcessTab from './tabs/ProcessTab';
import OptionsTab from './tabs/OptionsTab';
import InsightsTab from './tabs/InsightsTab';
import AttributesTab from './tabs/AttributesTab';
import MatplotlibTab from './tabs/MatplotlibTab';
import TurtleTab from './tabs/TurtleTab';

const TAB_TYPES = {
  file: FileTab,
  options: OptionsTab,
  process: ProcessTab,
  insights: InsightsTab,
  attributes: AttributesTab,
  matplotlib: MatplotlibTab,
  turtle: TurtleTab
};

export default class TabBar extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  componentWillMount() {
    this.props.project.on('change', this.onChange);
    this.onChange();
  }

  componentWillUnmount() {
    this.props.project.removeListener('change', this.onChange);
  }

  onChange() {
    this.setState({
      tabs: this.props.project.getTabs()
    });
  }

  onTabClick(index, e) {
    e.preventDefault();

    if (e.button === 1) {
      this.props.project.closeTab(index);
    } else if (e.ctrlKey || e.shiftKey) {
      // toggle tab should display it on a split view
      this.props.project.toggleTab(index);
    } else {
      this.props.project.switchTab(index);
    }
  }

  onTabClose(index, e) {
    e.preventDefault();

    this.props.project.closeTab(index);
  }

  onStartStop(e) {
    e.preventDefault();

    let project = this.props.project;

    if (project.isRunning()) {
      project.stop();
    } else {
      project.run();
    }
  }

  onSave(e) {
    e.preventDefault();

    this.props.project.saveEmbed();
  }

  renderTabs() {
    let project = this.props.project;

    return project.getTabs().map(({active, item, type, uniqueId}, index) => {
      let TabType = TAB_TYPES[type] || Tab;

      return (
        <TabType
          className="tab-item"
          key={uniqueId}
          active={active}
          item={item}
          onClick={this.onTabClick.bind(this, index)}
          onClose={this.onTabClose.bind(this, index)}
        />
      );
    });
  }

  render() {
    let project = this.props.project;
    let startStop;

    if (project.run) {
      startStop = (
        <NavItem onClick={this.onStartStop.bind(this)} useHref={false}>
          {project.isRunning() ? <Icon name="stop" className="danger"/> : <Icon name="play" className="success"/>}
        </NavItem>
      );
    }


    return (
      <div className="control-bar">
        <Nav className="tabs" bsStyle="pills">
          {this.renderTabs()}
        </Nav>
        <span className="embed-title">{project.name}</span>
        <Nav className="controls" bsStyle="pills">
          {startStop}
          <NavItem onClick={this.onSave.bind(this)} useHref={false}>
            <Icon name="save" />
          </NavItem>
          <Menu project={project}/>
        </Nav>
      </div>
    );
  }
}