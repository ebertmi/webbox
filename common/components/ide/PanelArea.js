import React from 'react';

import FilePanel from './panels/FilePanel';
import ProcessPanel from './panels/ProcessPanel';
import OptionsPanel from './panels/OptionsPanel';
import InsightsPanel from './panels/InsightsPanel';
import TurtlePanel from './panels/TurtlePanel';
import AttributesPanel from './panels/AttributesPanel';
import { MessageList } from '../messageList/messageList';
import MatplotlibPanel from './panels/MatplotlibPanel';

const PANEL_TYPES = {
  file: FilePanel,
  options: OptionsPanel,
  process: ProcessPanel,
  insights: InsightsPanel,
  turtle: TurtlePanel,
  attributes: AttributesPanel,
  matplotlib: MatplotlibPanel
};

export default class PanelArea extends React.Component {
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

  renderPanels() {
    return this.state.tabs.map(({active, item, type}, index) => {
      let PanelType = PANEL_TYPES[type];

      if (PanelType && (active || PanelType.renderInactive)) {
        return (
          <PanelType
            key={index}
            active={active}
            item={item}
          />
        );
      }
    });
  }

  renderGlobalMessageList() {
    return (
    <div className="global-message-list">
      <MessageList messageList={this.props.messageList} />
    </div>
    );
  }

  render() {
    return (
      <div className="panel-area">
        {this.renderGlobalMessageList()}
        {this.renderPanels()}
      </div>
    );
  }
}
