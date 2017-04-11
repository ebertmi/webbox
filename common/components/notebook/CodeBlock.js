import React from 'react';
import Markdown from '../../util/markdown';

export default class CodeBlock extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      rendered: ''
    };
  }

  componentDidMount() {
    this.renderMarkdown(this.props.code);
  }

  /**
   * Renders marks down and sets the returned markup as state when finished.
   */
  renderMarkdown(source) {
    // Get default language from notebook if mode is not available
    let language = this.props.executionLanguage;
    let mode = mode || language;

    const codeSource = '```' + mode + '\n' + source + '\n```';
    Markdown.render(codeSource)
      .then((rendered) => {
        this.setState({
          rendered: rendered
        });
      });
  }

  render() {
    return <div className="col-xs-12 read-view" dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
  }
}

CodeBlock.propTypes = {
  code: React.PropTypes.string.isRequired,
  executionLanguage: React.PropTypes.string.isRequired,
  mode: React.PropTypes.string.isRequired
};