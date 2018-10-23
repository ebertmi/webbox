import React from 'react';

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex';

import 'react-reflex/styles.css';

import FilePanel from './panels/FilePanel';
import ProcessPanel from './panels/ProcessPanel';
import OptionsPanel from './panels/OptionsPanel';
import InsightsPanel from './panels/InsightsPanel';
import TurtlePanel from './panels/TurtlePanel';
import AttributesPanel from './panels/AttributesPanel';
import { MessageList } from '../messagelist/messageList';
import MatplotlibPanel from './panels/MatplotlibPanel';
import TestAuthoringPanel from './panels/TestAuthoringPanel';
import TestResultPanel from './panels/TestResultPanel';

import Debug from 'debug';

const debug = Debug('webbox:PanelArea');

const PANEL_TYPES = {
  file: FilePanel,
  options: OptionsPanel,
  process: ProcessPanel,
  insights: InsightsPanel,
  turtle: TurtlePanel,
  attributes: AttributesPanel,
  matplotlib: MatplotlibPanel,
  tests: TestAuthoringPanel,
  testresult: TestResultPanel
};

export default class PanelArea extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);

    this.state = {
      tabs: []
    };
  }

  componentDidMount() {
    //this.props.project.on('change', this.onChange);
    this.props.project.tabManager.on('change', this.onChange);
    this.onChange();
  }

  componentWillUnmount() {
    //this.props.project.removeListener('change', this.onChange);
    this.props.project.tabManager.removeListener('change', this.onChange);
  }

  onChange() {
    this.setState({
      tabs: this.props.project.tabManager.getTabs()
    });
  }

  renderPanels() {
    return this.state.tabs.map(({active, item, type}, index) => {
      const PanelType = PANEL_TYPES[type];

      if (PanelType && (active || PanelType.renderInactive)) {
        return {
          panel: (<PanelType key={index} active={active} item={item} />),
          isInactive: PanelType.renderInactive,
          active: active
        };
      }

      return null;
    });
  }

  renderGlobalMessageList() {
    // ToDo: change this to use the notebook messageList except when in fullscreen mode
    return (
      <div className="global-message-list">
        <MessageList messageList={this.props.messageList} />
      </div>
    );
  }

  render() {
    const panels = this.renderPanels();

    const children = [];
    const inactiveChildren = [];

    panels.forEach((panelItem, i) => {
      if (panelItem === null || panelItem === undefined) {
        return;
      }

      if (panelItem.active === false /*&& panelItem.isInactive === true*/) {
        inactiveChildren.push(panelItem.panel);
        return;
      }

      const isLast = (panels.length - 1) == i;
      const minSize = '200';

      children.push(
        <ReflexElement
          key={`panel-${i}`}
          isInactive={panelItem.isInactive}
          propagateDimensions={true}
          renderOnResizeRate={50}
          renderOnResize={true}
          minSize={minSize}>{panelItem.panel}</ReflexElement>
      );

      if (isLast === false) {
        children.push(<ReflexSplitter key={`splitter-${i}`} propagate={true}/>);
      }
    });

    debug(inactiveChildren);

    return (
      <React.Fragment>
        <ReflexContainer className="panel-area" orientation="vertical">
          {children}
        </ReflexContainer>
        {inactiveChildren}
        {this.renderGlobalMessageList()}
      </React.Fragment>
    );
  }
}
