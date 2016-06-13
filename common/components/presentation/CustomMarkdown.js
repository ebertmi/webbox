import React from 'react';
import Markdown from '../../util/markdown';

export default class CustomMarkdown extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.setState({
      rendered: ''
    });
  }

  componentDidMount() {
    if (this.state.rendered === '') {
      this.renderMarkdown(this.props.source);
    }
  }

  /**
   * Renders marks down and sets the returned markup as state when finished.
   */
  renderMarkdown(source) {
    Markdown.render(source)
    .then((rendered) => {
      this.setState({
        rendered: rendered
      });
    });
  }

  render() {
    return <div dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
  }
}