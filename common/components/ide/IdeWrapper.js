import React from 'react';
import PropTypes from 'prop-types';

import Loader from '../Loader';
import Ide from './Ide';
import SourceboxProject from '../../models/project/sourceboxProject';
import SkulptProject from '../../models/project/skulptProject';
import { usageConsole } from '../../util/usageLogger';
import { MessageListModel } from '../../models/messages';
import { EmbedTypes } from '../../constants/Embed';
import { API } from '../../services';
import Debug from 'debug';
const debug = Debug('webbox:IdeWrapper');

const ErrorTypes = {
  EmbedLoadingError: "embedLoadingError",
  AuthentificationError: "authentificationError"
};

/**
 * Class represents wrapper for an instance of an ide component
 */
export default class IdeWrapper extends React.Component {
  /**
   *
   * @param {object} props properties of component
   */
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.onDownloadErrorNoticed = this.onDownloadErrorNoticed.bind(this);
    this.getAndSetEmbedMetadata = this.getAndSetEmbedMetadata.bind(this);
    this.onClick = this.onClick.bind(this);

    this.state = {
      codeData: null,
      embedName: "",
      embedLang: "",
      embedType: "",
      isDownloading: false,
      IdeComponent: null,
      error: null,
      errorType: null
    };
  }

  /**
   * Will be executed before rendering component. State changes won't trigger a re-rendering.
   * IdeWrapper use it to get meta data of embed for showing it without loading the whole.
   */
  componentWillMount() {
    this.getAndSetEmbedMetadata();
  }

  /**
   * Sets the error state with given error message.
   * Resets the isDownloading state if the error occurred while downloading embed
   *
   * @param {string} err specific message of occurred error
   * @param {ErrorTypes} type type of the error to set
   */
  setErrorState(err, type) {
    this.setState({
      error: err,
      errorType: type,
      isDownloading: false
    });
  }

  /**
   * Resets the error state
   */
  onDownloadErrorNoticed() {
    this.setState({
      error: null,
      errorType: null
    });
  }

  /**
   * Sets the embed data by given data.
   * Also it resets the isDownloading state.
   *
   * @param {object} data date of loaded embed
   */
  onProjectLoaded(data) {
    this.setState({
      codeData: data,
      isDownloading: false
    });
  }

  /**
   * Sets the isDownloading state, loads the ide component as well the embed data.
   * Sets the embed data automatically after downloading them.
   */
  onClick() {
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
      if(!data.error) {
        if(data.INITIAL_DATA.meta.embedType != EmbedTypes.Sourcebox && data.INITIAL_DATA.meta.embedType != EmbedTypes.Skulpt) {
          console.log(data.INITIAL_DATA.meta.embedType);
          this.setErrorState("Nicht unterstütztes Beispielformat.");
        }
        if(typeof Sk === "undefined") {
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
      debug(err);
    });
  }

  getAndSetEmbedMetadata() {
    // check if reloading meta data
    if(this.state.error != null) {
      this.setState({
        isDownloading: true
      });
    }

    // Call API to get metadata for this embed
    API.embed.getEmbedMetadata({ id: this.props.codeID }).then(data => {
      this.setState({
        embedName: data.meta.name,
        embedLang: data.meta.language,
        embedType: data.meta.embedType,
      });
    }).catch(err => {
      this.setErrorState("embed_loading_error", ErrorTypes.EmbedLoadingError);
      debug(err);
    });
  }

  /**
   * Generates embed window to render. Content depens on the current state
   */
  generateEmbedWindowByState() {
    let stateIndicator = "";
    let classNames = "";
    let headlineMessage = "";
    let clickEvent = null;
    classNames = (!this.state.codeData) ? "downloadEmbed" : "";
    if(this.state.error == null) {
      stateIndicator = (!this.state.isDownloading) ? <img src="/public/img/download.png" /> : <Loader type="line-scale" />;
      headlineMessage = this.state.embedName + " - " + this.state.embedLang;
      clickEvent = this.onClick;
    } else if(this.state.errorType == ErrorTypes.EmbedLoadingError) {
      stateIndicator = (!this.state.isDownloading) ? <i className="fa fa-3x fa-repeat" aria-hidden="true"></i> : <Loader type="line-scale" />;
      headlineMessage = this.state.error;
      clickEvent = this.getAndSetEmbedMetadata;
    } else {
      stateIndicator = <span className="lead">Ok</span>;
      headlineMessage = this.state.error;
      clickEvent = this.onDownloadErrorNoticed;
    }

    return <div className={"container " + classNames} onClick={clickEvent}>
              <h3>{headlineMessage}</h3>
              {stateIndicator}
          </div>;
  }

  /**
   * Creates html code to render depending on current state.
   */
  renderIdeWrapper() {
    let toRender;
    if ((this.state.codeData == null || this.state.IdeComponent == null) || this.state.error != null) { // check if embed data has been loaded
      return this.generateEmbedWindowByState();
    } else {
      let messageList = new MessageListModel(usageConsole);
      let projectData = {
        embed: this.state.codeData.INITIAL_DATA,
        user: this.state.codeData.USER_DATA,
        messageList: messageList,
        remoteDispatcher: this.context.remoteDispatcher,
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
      }

      toRender = <div className="col-xs-12" id="ide-container" style={{ height: this.props.height + 'px' }}><Ide project={project} messageList={messageList} /></div>;
    }

    return toRender;
  }

  /**
   * Renders component
   */
  render() {
    return this.renderIdeWrapper();
  }
}

/** Contains typchecking rules for specific members*/
IdeWrapper.propTypes = {
  codeID: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

/** Sets default values for specific properties */
IdeWrapper.defaultProps = {
  height: 500,
};

/** Sets accessability of context variables */
IdeWrapper.contextTypes = {
  remoteDispatcher: PropTypes.object
};