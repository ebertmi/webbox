import React from 'react';
import hljs from 'highlight.js';
import { getStyles } from "spectacle/lib/utils/base";
import Radium from "radium";

class Highlight extends React.Component {
  constructor(props) {
    super(props);

    this.onRef = this.onRef.bind(this);
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
    return (
      <pre className="hljs" ref={this.onRef} style={[this.context.styles.components.codePane.pre, getStyles.call(this), this.props.style]}>
        <code className={`language-${this.props.lang}`} style={this.context.styles.components.codePane.code}>{this.props.source}</code>
      </pre>
      );
  }
}

Highlight.contextTypes = {
  styles: React.PropTypes.object
};

Highlight.defaultProps = {
  lang: '',
  source: ''
};

export default Radium(Highlight);