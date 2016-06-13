import React from "react";

export class MarkdownHTMLElement extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const markup = {__html: this.props.content};
    if (this.props.displayMode === false) {
      return <span style={this.props.style} dangerouslySetInnerHTML={markup}></span>;
    } else {
      return <div style={this.props.style} dangerouslySetInnerHTML={markup}></div>;
    }
  }
}

export default MarkdownHTMLElement;