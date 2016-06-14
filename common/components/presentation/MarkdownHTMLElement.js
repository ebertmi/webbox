import React from "react";

/**
 * Pure Render Component for inserting inner HTML
 */
export default function MarkdownHTMLElement (props) {
  const {style, content, ...rest} = props;

  const markup = {__html: content};
  if (props.displayMode === false) {
    return <span style={style} {...rest} dangerouslySetInnerHTML={markup}></span>;
  } else {
    return <div style={style} {...rest} dangerouslySetInnerHTML={markup}></div>;
  }
}
