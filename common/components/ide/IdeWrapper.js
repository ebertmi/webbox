import React from 'react';

import Loader from '../Loader';
import Ide from './Ide';
import SourceboxProject from '../../models/project/sourceboxProject';
import SkulptProject from '../../models/project/skulptProject';
import { usageConsole } from '../../util/usageLogger';
import { MessageListModel } from '../../models/messages';
import { EmbedTypes } from '../../constants/Embed';
import { API } from '../../services';

export default class IdeWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.onDownloadErrorNoticed = this.onDownloadErrorNoticed.bind(this);

    this.state = {
      codeData: null,
      embedName: null,
      embedLang: null,
      embedType: null,
      isDownloading: false,
      IdeComponent: null,
      error: null
    };
  }

  componentWillMount() {
    // Call API to get metadata for this embed
    API.embed.getEmbedMetadata({ id: this.props.codeID }).then(data => {
      // update state with the required meta data and then rerender and display the name...
      this.setState({
        embedName: data.meta.name,
        embedLang: data.meta.language,
        embedType: data.meta.embedType
      });
    }).catch(err => {
      // ToDo: handle connection/server errors
      console.error(err);
    });
  }

  setErrorState(err) {
    this.setState({
      error: err,
      isDownloading: false
    });
  }

  onDownloadErrorNoticed(e) {
    this.setState({
      error: null
    });
  }

  onProjectLoaded(data) {
    this.setState({
      codeData: data,
      isDownloading: false
    });
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

    API.embed.getEmbed({ id: this.props.codeID  }).then(data => {
      console.log(data.error);
      if(!data.error) {
        if(typeof Sk === "undefined") {
          console.log("skulpt has not been loaded yet")
          require.ensure([], require => {
            require('exports-loader?Sk!../../../public/skulpt/skulpt.min.js');
            require('exports-loader?Sk!../../../public/skulpt/skulpt-stdlib.js');
            this.onProjectLoaded(data);
          });
        } else {
          this.onProjectLoaded(data);
        }
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
        let stateIndicator = (!this.state.isDownloading) ? <img src="/public/img/download.png" /> : <Loader type="line-scale" />;
        let classNames = (!this.state.codeData) ? "downloadEmbed" : "";
        toRender = <div className={"container " + classNames} onClick={this.onClick}>
          <h3>{this.state.embedName} - {this.state.embedLang}</h3>
          {stateIndicator}
        </div>;
      } else {
        // TODO: replace hardcoded text by preconfigured text
        toRender = <div className="alert alert-danger alert-dismissable col-xs-12">
          <a onClick={this.onDownloadErrorNoticed} className="close" data-dismiss="alert" aria-label="close">&times;</a>
          <strong>Fehler:</strong> {this.state.error}
        </div>;
      }
    } else {
      // Currently jwt and url will be set with every instance, maybe set default configuration, think token (per user) and url will be always equal
      this.context.remoteDispatcher.jwt = this.state.codeData.websocket.authToken;
      this.context.remoteDispatcher.url = this.state.codeData.websocket.server;
      let messageList = new MessageListModel(usageConsole);
      let projectData = {
        embed: this.state.codeData.INITIAL_DATA,
        user: this.state.codeData.USER_DATA,
        messageList: messageList,
        remoteDispatcher: this.context.remoteDispatcher,
        // might be removed
        communication: {
          jwt: this.state.codeData.websocket.authToken,
          url: this.state.codeData.websocket.server
        }
      };

      let project;
      if(this.state.embedType === EmbedTypes.Sourcebox) {
        project = new SourceboxProject(projectData, {
          auth: this.state.codeData.sourcebox.authToken,
          server: this.state.codeData.sourcebox.server,
          transports: this.state.codeData.sourcebox.transports || ['websocket']
        });
      } else if(this.state.embedType === EmbedTypes.Skulpt) {
        project = new SkulptProject(projectData);
      } else {
        console.error('Unsupported embedType', window.__INITIAL_DATA__);
      }


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

IdeWrapper.contextTypes = {
  remoteDispatcher: React.PropTypes.object
};