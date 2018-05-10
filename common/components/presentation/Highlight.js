import React from 'react';
import PropTypes from 'prop-types';
import hljs from 'highlight.js';
import { getStyles } from 'spectacle/lib/utils/base';
import styled from 'react-emotion';

import { EmbedTypes, RunModeDefaults } from '../../constants/Embed';
import Icon from '../Icon';

const StyledPre = styled.pre(props => props.styles);

/**
 * Highlights CodePanes using highlight.js.
 * Uses the same styles are the original CodePane Component.
 * You can pass in a language and the source (string).
 */
class Highlight extends React.Component {
  constructor(props) {
    super(props);

    this.onRef = this.onRef.bind(this);
    this.onRun = this.onRun.bind(this);

    this.preNode = React.createRef();
  }

  componentDidMount() {
    this.highlightCode();
  }

  shouldComponentUpdate() {
    return false;
  }

  componentDidUpdate() {
    this.highlightCode();
  }

  /**
   * Clicked the run button. Should we enable postMessage communication with the new window?
   * Maybe at some point later
   *
   * @returns {void}
   */
  onRun() {
    /**
     * Running an unnamed example:
     *  - Get the current code
     *  - Get the set language (we need to know how to run the code)
     *  - Either use the set id for statistics or generate a new one
     *  - Current course/chapter (for statistics)
     */
    // short test
    const code = this.props.code;
    const language = this.props.executionLanguage;
    const embedType = this.props.embedType || EmbedTypes.Sourcebox;
    const id = this.props.runId || RunModeDefaults.id;

    const url = `${window.location.protocol}//${window.location.host}/run?language=${encodeURIComponent(language)}&id=${encodeURIComponent(id)}&embedType=${encodeURIComponent(embedType)}&code=${encodeURIComponent(code)}`;
    const strWindowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';

    window.open(url, 'Beispiel Ausführen', strWindowFeatures);
  }

  onRef(node) {
    this.preNode = node;
  }

  highlightCode () {
    if (this.preNode.current == null) {
      return;
    }

    const nodes = this.preNode.current.querySelectorAll('code');
    if (nodes.length > 0) {
      for (var i = 0; i < nodes.length; i=i+1) {
        hljs.highlightBlock(nodes[i]);
      }
    }
  }

  render() {
    const styles = [
      this.context.styles.components.codePane.pre,
      getStyles.call(this),
      this.context.typeface || {},
      this.props.style,
    ];

    const runBtnStyles = {
      position: 'absolute',
      left: '-1em',
      top: '0em'
    };
    const lang = `language-${this.props.mode}`;
    const runBtn = this.props.showRunButton ? <Icon style={runBtnStyles} name="play-circle-o" className="icon-control" onClick={this.onRun} title="Code Ausführen" /> : null;
    return (
      <div className="highlight-view" style={{position: 'relative'}}>
        <StyledPre className="hljs" ref={this.onRef} styles={styles}>
          <code className={lang} style={this.context.styles.components.codePane.code}>{this.props.code}</code>
        </StyledPre>
        {runBtn}
      </div>
    );
  }
}

Highlight.contextTypes = {
  styles: PropTypes.object
};

Highlight.defaultProps = {
  mode: '',
  executionLanguage: '',
  code: '',
  showRunButton: false,
  style: {}
};

export default Highlight;