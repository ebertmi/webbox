import React from 'react';

import screenfull from 'screenfull';
import Icon from '../Icon';
import {Nav, NavItem} from '../bootstrap';

import Menu from './Menu';
import SendToTeacherModal from './SendToTeacherModal';

import Tab from './tabs/Tab';
import FileTab from './tabs/FileTab';
import ProcessTab from './tabs/ProcessTab';
import OptionsTab from './tabs/OptionsTab';
import InsightsTab from './tabs/InsightsTab';
import AttributesTab from './tabs/AttributesTab';
import MatplotlibTab from './tabs/MatplotlibTab';
import TurtleTab from './tabs/TurtleTab';
import TestAuthoringTab from './tabs/TestAuthoringTab';
import TestResultTab from './tabs/TestResultTab';
import { MODES } from '../../constants/Embed';

import ScrollableElement from '../scrollable/ScrollableElement';

const TAB_TYPES = {
  file: FileTab,
  options: OptionsTab,
  process: ProcessTab,
  insights: InsightsTab,
  attributes: AttributesTab,
  matplotlib: MatplotlibTab,
  turtle: TurtleTab,
  tests: TestAuthoringTab,
  testresult: TestResultTab
};

export default class TabBar extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onStartStop = this.onStartStop.bind(this);
    this.onTest= this.onTest.bind(this);
    this.onShareWithTeacher = this.onShareWithTeacher.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onToggleFullscreen = this.onToggleFullscreen.bind(this);
    this.onScreenfullChange = this.onScreenfullChange.bind(this);
    this.onTabListScroll = this.onTabListScroll.bind(this);
    this.onToggleSendToTeacherModal = this.onToggleSendToTeacherModal.bind(this);

    this.state = {
      showSendToTeacherModal: false
    };
  }

  onToggleSendToTeacherModal() {
    this.setState({
      showSendToTeacherModal: !this.state.showSendToTeacherModal
    });
  }

  onShareWithTeacher(message) {
    this.props.project.shareWithTeacher(message);
  }

  onScreenfullChange() {
    this.forceUpdate();
  }

  componentWillMount() {
    this.props.project.on('change', this.onChange);
    this.props.project.tabManager.on('change', this.onChange);
    this.onChange();
  }

  componentDidMount() {
    // Add screenfull listener
    if (screenfull.enabled) {
      document.addEventListener(screenfull.raw.fullscreenchange, this.onScreenfullChange);
    }
  }

  componentWillUnmount() {
    this.props.project.removeListener('change', this.onChange);
    this.props.project.tabManager.removeListener('change', this.onChange);

    if (screenfull.enabled) {
      // Remove listener (cleanup)
      document.removeEventListener(screenfull.raw.fullscreenchange, this.onScreenfullChange);
    }
  }

  onChange() {
    this.setState({
      tabs: this.props.project.tabManager.getTabs()
    });
  }

  /**
   * Toggles between fullscreen and normal, if supported
   */
  onToggleFullscreen(e) {
    if (screenfull.enabled) {
      screenfull.toggle(e.currentTarget.closest(".ide"));
    }
  }

  onTabClick(index, e) {
    e.preventDefault();

    if (e.button === 1) {
      this.props.project.tabManager.closeTab(index);
    } else if (e.ctrlKey || e.shiftKey) {
      // toggle tab should display it on a split view
      this.props.project.tabManager.toggleTab(index);
    } else {
      this.props.project.tabManager.switchTab(index);
    }
  }

  onTabClose(index, e) {
    e.preventDefault();

    this.props.project.tabManager.closeTab(index);
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

  onTest(e) {
    e.preventDefault();

    let project = this.props.project;

    if (project.isRunning()) {
      project.stop();
    } else {
      project.test();
    }
  }

  onSave(e) {
    e.preventDefault();

    this.props.project.saveEmbed();
  }

  onTabListScroll(offset) {
    if (this.tabList != null) {
      if (offset.scrollLeft != null) {
        this.tabList.scrollLeft = offset.scrollLeft;
      }
    }
  }

  renderTabs() {
    let project = this.props.project;

    return project.tabManager.getTabs().map(({active, item, type, uniqueId}, index) => {
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
    let tester;
    let shareWithTeacher;
    const isRunning = project.isRunning();

    const fullScreenIcon = screenfull.isFullscreen ? 'compress' : 'expand';

    if (project.run) {
      startStop = (
        <NavItem className="unselectable" onClick={this.onStartStop} title="Ausführen/Stoppen (Strg+B)" useHref={false}>
          {isRunning ? <Icon name="stop" className="danger"/> : <Icon name="play" className="success"/>}
        </NavItem>
      );
    }

    if (project.test && project.hasTestCode()) {
      tester = (
        <NavItem className="unselectable" onClick={this.onTest} useHref={false}>
          <Icon name="check-square-o" />
        </NavItem>
      );
    }

    if (this.props.project.mode === MODES.Default) {
      shareWithTeacher = (
          <NavItem className="unselectable" onClick={this.onToggleSendToTeacherModal} useHref={false} title="An Dozenten schicken" >
            <Icon className="unselectable" name="paper-plane" title="An Dozenten schicken" />
          </NavItem>
      );
    }

    return (
      <div className="control-bar">
        <ScrollableElement scrollYToX={true} className="tabs-scroll-wrapper" onScroll={this.onTabListScroll}>
          <nav className="tabs-container" ref={ref => this.tabList = ref}>
            {this.renderTabs()}
          </nav>
        </ScrollableElement>
        <span className="embed-title">{project.name}</span>
        <Nav className="controls" bsStyle="pills">
          {startStop}
          {tester}
          <NavItem className="unselectable" onClick={this.onSave} useHref={false} title="Speichern (Strg+S)">
            <Icon name="save" />
          </NavItem>
          { shareWithTeacher }
          <SendToTeacherModal isOpen={this.state.showSendToTeacherModal} toggle={this.onToggleSendToTeacherModal} callback={this.onShareWithTeacher}/>

          <NavItem className="unselectable" onClick={this.onToggleFullscreen} title="Vollbildmodus" disabled={!screenfull.enabled}>
            <Icon name={fullScreenIcon} title="Vollbildmodus"/>
          </NavItem>
          <Menu project={project}/>
        </Nav>
      </div>
    );
  }
}
