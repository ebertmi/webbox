import React from 'react';
import PropTypes from 'prop-types';
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
   *
   * @param {string} source source code to render
   *
   * @returns {void}
   */
  renderMarkdown(source) {
    // Get default language from notebook if mode is not available
    const language = this.props.executionLanguage;
    const mode = this.props.mode || language;

    const codeSource = `\`\`\`${mode}\n${source}\n\`\`\``;
    Markdown.render(codeSource)
      .then((rendered) => {
        this.setState({
          rendered: rendered
        });
      });
  }

  render() {
    return <div className="col-12 read-view" dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
  }
}

CodeBlock.propTypes = {
  code: PropTypes.string.isRequired,
  executionLanguage: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired
};