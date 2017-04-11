import React from 'react';
import PropTypes from 'prop-types';
import hljs from 'highlight.js';
import { getStyles } from "spectacle/lib/utils/base";
import Radium from "radium";

import { EmbedTypes, RunModeDefaults } from '../../constants/Embed';
import Icon from '../Icon';

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
  }

  componentDidMount() {
    this.highlightCode();
  }
  componentDidUpdate() {
    this.highlightCode();
  }

  shouldComponentUpdate() {
    return false;
  }

  /**
   * Clicked the run button. Should we enable postMessage communication with the new window?
   * Maybe at some point later
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
    const code = this.props.source;
    const language = this.props.executionLanguage;
    const embedType = this.props.embedType || EmbedTypes.Sourcebox;
    const id = this.props.runId || RunModeDefaults.id;

    const url = `${window.location.protocol}//${window.location.host}/run?language=${encodeURIComponent(language)}&id=${encodeURIComponent(id)}&embedType=${encodeURIComponent(embedType)}&code=${encodeURIComponent(code)}`;
    const strWindowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";

    window.open(url, "Beispiel Ausführen", strWindowFeatures);
  }

  onRef(node) {
    this.preNode = node;
  }

  highlightCode () {
    if (!this.preNode) {
      return;
    }

    var nodes = this.preNode.querySelectorAll('code');
    if (nodes.length > 0) {
      for (var i = 0; i < nodes.length; i=i+1) {
        hljs.highlightBlock(nodes[i]);
      }
    }
  }

  render() {
    const runBtnStyles = {
      position: "absolute",
      left: "-1em",
      top: "0em"
    };
    const lang = `language-${this.props.lang}`;
    const runBtn = this.props.showRunButton ? <Icon style={runBtnStyles} name="play-circle-o" className="icon-control" onClick={this.onRun} title="Code Ausführen" /> : null;
    return (
      <div style={{position: "relative"}}>
        <pre className="hljs" ref={this.onRef} style={[this.context.styles.components.codePane.pre, getStyles.call(this), this.props.style]}>
          <code className={lang} style={this.context.styles.components.codePane.code}>{this.props.source}</code>
        </pre>
        {runBtn}
      </div>
      );
  }
}

Highlight.contextTypes = {
  styles: PropTypes.object
};

Highlight.defaultProps = {
  lang: '',
  executionLanguage: '',
  source: '',
  showRunButton: false
};

export default Radium(Highlight);