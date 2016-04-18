import React from 'react';

import FilePanel from './panels/FilePanel';
import ProcessPanel from './panels/ProcessPanel';
import OptionsPanel from './panels/OptionsPanel';

const PANEL_TYPES = {
  file: FilePanel,
  options: OptionsPanel,
  process: ProcessPanel
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

  render() {
    return (
      <div className="panel-area">
        {this.renderPanels()}
      </div>
    );
  }
}
