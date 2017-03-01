import React from 'react';

import Ide from './Ide';
import SourceboxProject from '../../models/project/sourceboxProject';
import { usageConsole } from '../../util/usageLogger';
import { MessageListModel } from '../../models/messages';
import { API } from '../../services';

export default class IdeWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.onDownloadErrorNoticed = this.onDownloadErrorNoticed.bind(this);

    this.state = {
      codeData: null,
      isDownloading: false,
      IdeComponent: null,
      error: null
    };
  }

  setErrorState(err) {
    this.setState({
      error: err,
      isDownloading: false
    })
  }

  onDownloadErrorNoticed(e) {
    this.setState({
      error: null
    })
  }

  onClick(e) {
    this.setState({
      codeData: null,
      isDownloading: true
    });

    if (this.state.IdeComponent === null) {
      require.ensure('./Ide', require => {
        const Ide = require('./Ide');

        this.setState({
          IdeComponent: Ide.default
        });
      });
    }

    API.embed.getEmbed({ id: this.props.codeID }).then(data => {
      if(!data.error) {
        this.setState({
          codeData: data,
          isDownloading: false
        });
      } else {
        this.setErrorState(data.error.title);
      }

    }).catch(err => {
      this.setErrorState(err);
      console.log(err);
    });
  }

  renderIdeWrapper() {
    let toRender;
    if (this.state.codeData == null || this.state.IdeComponent == null) {
      if(this.state.error == null) {
        let image = (!this.state.isDownloading) ? "/public/img/download.png" : "/public/img/reload.svg"
        toRender = <div className="container" onClick={this.onClick}>
          <img src={image} />
        </div>;
      } else {
        // TODO: replace hardcoded text by preconfigured text
        toRender = <div className="alert alert-danger alert-dismissable col-xs-12">
          <a href="#" onClick={this.onDownloadErrorNoticed} className="close" data-dismiss="alert" aria-label="close">&times;</a>
          <strong>Fehler:</strong> {this.state.error}
        </div>
      }
    } else {
      let messageList = new MessageListModel(usageConsole);
      let projectData = {
        embed: this.state.codeData.INITIAL_DATA,
        user: this.state.codeData.USER_DATA,
        messageList: messageList,
        communication: {
          jwt: this.state.codeData.websocket.authToken,
          url: this.state.codeData.websocket.server
        }
      };

      // TODO add skulpt support
      let project = new SourceboxProject(projectData, {
        auth: this.state.codeData.sourcebox.authToken,
        server: this.state.codeData.sourcebox.server,
        transports: this.state.codeData.sourcebox.transports || ['websocket']
      });

      toRender = <div className="col-xs-12" id="ide-container" style={{ height: this.props.height + 'px' }}><Ide project={project} messageList={messageList} /></div>;
    }

    return toRender;
  }

  render() {
    return this.renderIdeWrapper();
  }
}

IdeWrapper.propTypes = {
  codeID: React.PropTypes.string.isRequired,
  width: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
  height: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
};

IdeWrapper.defaultProps = {
  height: 500,
};
