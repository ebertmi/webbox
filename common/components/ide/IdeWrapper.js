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
  EmbedLoadingError: 'embedLoadingError',
  AuthentificationError: 'authentificationError'
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
      embedName: '',
      embedLang: '',
      embedType: '',
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
      import('./Ide').then(Ide => {
        this.setState({ IdeComponent: Ide.default });
      }).catch(err => {
        debug('Failed to load Ide component', err);
      });
    }

    API.embed.getEmbed({ id: this.props.codeID }).then(data => {
      if (!data.error) {
        if (data.INITIAL_DATA.meta.embedType != EmbedTypes.Sourcebox && data.INITIAL_DATA.meta.embedType != EmbedTypes.Skulpt) {
          debug(data.INITIAL_DATA.meta.embedType);
          this.setErrorState('Nicht unterstütztes Beispielformat.');
        }
        if (typeof Sk === 'undefined') {
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

  /**
   * Sets the error state with given error message.
   * Resets the isDownloading state if the error occurred while downloading embed
   *
   * @param {string} err specific message of occurred error
   * @param {ErrorTypes} type type of the error to set
   * @returns {undefined}
   */
  setErrorState(err, type) {
    this.setState({
      error: err,
      errorType: type,
      isDownloading: false
    });
  }

  getAndSetEmbedMetadata() {
    // check if reloading meta data
    if (this.state.error != null) {
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
      this.setErrorState('embed_loading_error', ErrorTypes.EmbedLoadingError);
      debug(err);
    });
  }

  generatePattern(xOffset, yOffset, patternHeight, patternMulti) {
    const pattern = [];
    const offset = patternMulti * patternHeight + yOffset;
    pattern.push(<rect x={0 + xOffset} y={0 + offset} width="67.0175439" height="11.9298746" rx="2"></rect>);
    pattern.push(<rect x={76.8421053 + xOffset} y={0 + offset} width="140.350877" height="11.9298746" rx="2"></rect>);
    pattern.push(<rect x={18.9473684 + xOffset} y={47.7194983 + offset} width="100.701754" height="11.9298746" rx="2"></rect>);
    pattern.push(<rect x={0 + xOffset} y={71.930126 + offset} width="37.8947368" height="11.9298746" rx="2"></rect>);
    pattern.push(<rect x={127.017544 + xOffset} y={48.0703769 + offset} width="53.3333333" height="11.9298746" rx="2"></rect>);
    pattern.push(<rect x={187.719298 + xOffset} y={48.0703769 + offset} width="72.9824561" height="11.9298746" rx="2"></rect>);
    pattern.push(<rect x={17.8947368 + xOffset} y={23.8597491 + offset} width="140.350877" height="11.9298746" rx="2"></rect>);
    pattern.push(<rect x={166.315789 + xOffset} y={23.8597491 + offset} width="173.684211" height="11.9298746" rx="2"></rect>);
    return pattern;
  }

  generateSVGOverlay(height, headline, headlineColor, fontColor, state) {
    const draw = [];
    const patternHeight = 96;
    let stateDraw;

    switch (state) {
      case 'downloading': {
        stateDraw = '';
        break;
      }
      case 'notLoaded': {
        stateDraw = <image xlinkHref="/public/img/download.png" x="50%" y="50%" height="75" width="75" transform="translate(-37.5,-37.5)"/>;
        break;
      }
      default: {
        stateDraw = '';
        break;
      }
    }
    headlineColor = (headlineColor) ? headlineColor : '#ececec';
    fontColor = (fontColor) ? fontColor : '#000';

    for (let i = 0; i < ((height - 58) / patternHeight) - 1; i++) {
      draw.push(this.generatePattern(55, 40, patternHeight, i));
    }

    const svg = <svg aria-hidden="true" width="100%" height={height} version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" className="diff-placeholder-svg position-absolute bottom-0">
      <rect className="js-diff-placeholder" x="0" y="0" width="100%" height="35" fill={headlineColor} fillRule="evenodd" />
      <text x="50%" y="25" fill={fontColor} fontSize="18" fontWeight="700" textAnchor="middle">{headline}</text>
      <rect className="js-diff-placeholder" x="0" y="35" width="44" height={height - 58} fill="#e8e8e8" fillRule="evenodd"></rect>
      <path className="js-diff-placeholder" clipPath="url(#diff-placeholder)" d={`M0 0h1200v${height}H0z`} fill="#ccc" fillRule="evenodd"></path>
        <clipPath id="diff-placeholder">
          {draw}
        </clipPath>
      <rect className="js-diff-placeholder" x="0" y={height - 24} width="100%" height={24} fill="#007ACC" fillRule="evenodd"></rect>
      {stateDraw}
    </svg>;
    return svg;
  }

  /**
   * Generates embed window to render. Content depens on the current state
   * @returns {React.Node} embed window
   */
  generateEmbedWindowByState() {
    let stateIndicator = '';
    let classNames = '';
    let headlineMessage = '';
    let overlay = '';
    let clickEvent = null;
    classNames = (!this.state.codeData) ? 'downloadEmbed' : '';
    if (this.state.error == null) {
      stateIndicator = (!this.state.isDownloading) ? '' : <Loader type="line-scale" />;
      headlineMessage = this.state.embedName + ' - ' + this.state.embedLang;
      clickEvent = this.onClick;
      overlay = this.generateSVGOverlay(this.props.height, headlineMessage, null, null, (!this.state.isDownloading) ? 'notLoaded' : 'downloading');
    } else if (this.state.errorType == ErrorTypes.EmbedLoadingError) {
      stateIndicator = (!this.state.isDownloading) ? <i className="fa fa-3x fa-repeat" aria-hidden="true"></i> : <Loader type="line-scale" />;
      headlineMessage = this.state.error;
      clickEvent = this.getAndSetEmbedMetadata;
      overlay = this.generateSVGOverlay(this.props.height, headlineMessage, '#f00', '#fff');
    } else {
      stateIndicator = <span className="lead">Ok</span>;
      headlineMessage = this.state.error;
      clickEvent = this.onDownloadErrorNoticed;
      overlay = this.generateSVGOverlay(this.props.height, headlineMessage, '#f00', '#fff');
    }

    return <div className={`container ${classNames}`} onClick={clickEvent}>
              {stateIndicator}
              {overlay}
          </div>;
  }

  /**
   * Creates html code to render depending on current state.
   * 
   * @returns {React.Node} IdeWrapper Node
   */
  renderIdeWrapper() {
    let toRender;
    if ((this.state.codeData == null || this.state.IdeComponent == null) || this.state.error != null) { // check if embed data has been loaded
      return this.generateEmbedWindowByState();
    } else {
      const messageList = new MessageListModel(usageConsole);
      const projectData = {
        embed: this.state.codeData.INITIAL_DATA,
        user: this.state.codeData.USER_DATA,
        messageList: messageList,
        remoteDispatcher: this.context.remoteDispatcher,
      };

      let project;
      if (this.state.embedType === EmbedTypes.Sourcebox) {
        project = new SourceboxProject(projectData, {
          auth: this.state.codeData.sourcebox.authToken,
          server: this.state.codeData.sourcebox.server,
          transports: this.state.codeData.sourcebox.transports || ['websocket']
        });
      } else if (this.state.embedType === EmbedTypes.Skulpt) {
        project = new SkulptProject(projectData);
      }

      toRender = <div className="col-xs-12" id="ide-container" style={{ height: `${this.props.height}px` }}><Ide project={project} messageList={messageList} /></div>;
    }

    return toRender;
  }

  /**
   * Renders component
   *
   * @returns {React.Node} rendered node
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