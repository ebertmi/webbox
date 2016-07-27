import React from 'react';

import screenfull from 'screenfull';
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
import { MODES } from '../../constants/Embed';

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
    this.onStartStop = this.onStartStop.bind(this);
    this.onShareWithTeacher = this.onShareWithTeacher.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onToggleFullscreen = this.onToggleFullscreen.bind(this);
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

  /**
   * Toggles between fullscreen and normal, if supported
   */
  onToggleFullscreen() {
    if (screenfull.enabled) {
      screenfull.toggle();

      // Force rerendering, otherwise the icon does not change
      this.forceUpdate();
    }
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

  onShareWithTeacher(e) {
    e.preventDefault();
    this.props.project.shareWithTeacher();
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
    let shareWithTeacher;

    const fullScreenIcon = screenfull.isFullscreen ? 'compress' : 'expand';

    if (project.run) {
      startStop = (
        <NavItem className="unselectable" onClick={this.onStartStop} useHref={false}>
          {project.isRunning() ? <Icon name="stop" className="danger"/> : <Icon name="play" className="success"/>}
        </NavItem>
      );
    }

    if (this.props.project.mode === MODES.Default) {
      shareWithTeacher = (
          <NavItem className="unselectable" onClick={this.onShareWithTeacher} useHref={false} title="An Dozenten schicken" >
            <Icon className="unselectable" name="paper-plane" title="An Dozenten schicken" />
          </NavItem>
      );
    }

    return (
      <div className="control-bar">
        <nav className="tabs-container">
          {this.renderTabs()}
        </nav>
        <span className="embed-title">{project.name}</span>
        <Nav className="controls" bsStyle="pills">
          {startStop}
          <NavItem className="unselectable" onClick={this.onSave} useHref={false} title="Speichern">
            <Icon name="save" />
          </NavItem>
          { shareWithTeacher }

          <NavItem className="unselectable" onClick={this.onToggleFullscreen} disabled={!screenfull.enabled}>
            <Icon name={fullScreenIcon} title="Vollbildmodus"/>
          </NavItem>
          <Menu project={project}/>
        </Nav>
      </div>
    );
  }
}
