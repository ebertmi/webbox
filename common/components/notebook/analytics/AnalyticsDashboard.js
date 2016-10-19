import React, { Component } from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import Debug from 'debug';

import { getCodeEmbedsFromNotebook } from '../../../util/nbUtil';
import { MultiEmbedAnalytics } from '../../../models/insights/multiEmbedAnalytics';
import EventClusterChart from './EventClusterChart';

const debug = Debug('webbox:AnalyticsDashboard');

/**
 * ToDo: Subscribe to all embed ids. How can we handle the permissions? Server-side?
 * Plot all the events on a single graph? Maybe one series for one embed
 * Add test result plots for individual embeds or only one? Or maybe only for those with data
 *
 * @export
 * @class AnalyticsDashboard
 * @extends {Component}
 */
export default class AnalyticsDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      embeds: []
    };

    // Bindings
    this.onChange = this.onChange.bind(this);
  }

  componentWillMount() {
    let embeds = getCodeEmbedsFromNotebook(this.props.notebook);
    embeds = embeds.toArray();

    this.setState({
      embeds: embeds,
      analytics: new MultiEmbedAnalytics(embeds)
    });
    debug('Will mount with following embeds', embeds);
  }

  componentDidMount() {
    // Retrieve inital date and subscribe
    if (this.shouldRender() && this.state.analytics != null) {
      this.state.analytics.on('change', this.onChange);
      this.state.analytics.init();
    }
  }

  componentWillUnmount() {
    // Unsubscribe, ... ...
    if (this.state.analytics != null) {
      this.state.analytics.dispose();
    }
  }

  onChange() {
    this.forceUpdate();
  }

  shouldRender() {
    return window.USER_DATA != null && window.USER_DATA.isAnonymous != null && window.USER_DATA.isAnonymous === false;
  }

  render() {

    if (this.shouldRender()) {
      let entries = this.state.analytics.getEntries();
      let children = [];

      entries.forEach((value, key) => {
        debug('Adding EventClusterChart for embed %s', key);
        children.push(<EventClusterChart key={key} series={value.dateClustersToSeries()} />);
        children.push(<p className="text-muted">Beispiel: {key}</p>);
      });

      if (children.length === 0) {
        children.push(<p>Das Dokument enthält keine auswertbaren Beispiele.</p>);
      }

      return (
        <div className="analytics col-xs-12">
          <h4>Statistiken</h4>
          {children}
        </div>
      );
    } else {
      return null;
    }
  }
}