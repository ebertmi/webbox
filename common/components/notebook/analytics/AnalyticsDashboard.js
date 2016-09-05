import React, { Component } from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';

import { SocketConnection } from '../../../models/insights/socketConnection';
import { getCodeEmbedsFromNotebook } from '../../../util/nbUtil';

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

    this.state = {};
    this.socketConnection = new SocketConnection({
      jwt: '',
      url: ''
    });
  }

  componentWillMount() {
    let ids = getCodeEmbedsFromNotebook(this.props.notebook);
  }

  componentDidMount() {

  }

  componentWillUnmount() {
    // Unsubscribe, ... ...
  }

  render() {
    return (
      <div className="analytics">
        <p>Anlaytics here!!!!11!!ELF11elf1!</p>
      </div>
    );
  }
}