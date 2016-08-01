import React from 'react';
import katex from 'katex';
import mkitm from 'markdown-it-math';
import isString from 'lodash/isString';
import { S, Code, BlockQuote, Quote, Heading, Image, Link, Text, ListItem, List } from "spectacle/lib/index";
import Decorate from 'markdown-it-decorate';

import MDReactComponent from './MDReactComponent';
import Math from './Math';
import MarkdownHTMLElement from './MarkdownHTMLElement';
import Highlight from './Highlight';
import OrderedList from './OrderedList';


/**
 * Transforms any inline HTML from text to real HTML (react)
 */
function makeChildren(children, props) {
  let result = [];
  let keyCounter = 0;
  let openTags = 0;
  let htmlContent = [];

  if (!Array.isArray(children)) {
    children = [].push(children);
  }

  /**
   * Push all normal children to result.
   * If we find an opening tag, we push the content to the htmlContent
   *  -> now every child is pushed to htmlContent until we find an closing tag
   *  -> if there are multiple opening tags, we wait until we found the last closing one
   *
   * WARNING: This will fail if somebody injects errornous HTML code, which causes to not render the node at all.
   */
  for (let child of children) {
    if (child.type && child.type === 'htmlinline') {
      // 1. Is opening Tag?
      if (child.content.indexOf('/') < 0) {
        openTags += 1;
        htmlContent.push(child.content);
      } else {
        // closing tag
        openTags -= 1;
        htmlContent.push(child.content);

        // done
        if (openTags === 0) {
          let {key, ...rest} = props; // Extract key from props
          result.push(<MarkdownHTMLElement key={`${key}-inlinehtml-${keyCounter}`} {...rest} displayMode={false} content={htmlContent.join('')} />);
          keyCounter += 1;
          htmlContent = []; // Reset
        }
      }
    } else if (openTags > 0) {
      // add child to html
      htmlContent.push(child);
    } else {
      result.push(child);
    }
  }

  return result;
}

export const mdOptions = {
  onIterate: function onIterate(tag, props, children) {
    let lang;
    let content;
    let displayMode;
    let source;

    if (props.class != null) {
      props.className = props.class;
    }

    switch (tag) {
      case 'a':
        return <Link href={props.href} target="_blank" {...props}>{children}</Link>;

      case 'code':
        content = Array.isArray(children) ? children.join('') : children;
        return <Code {...props}>{content}</Code>;

      case 'pre':
        if (isString(children[0])) {
          source = children[0];
        } else {
          source = children[0].props.children;
        }

        if (Array.isArray(source)) {
          source = source.join('');
        }

        lang = children[0].props['data-language'] || null;
        return <Highlight lang={lang} source={source} {...props} />;

      case 'p':
        content = makeChildren(children, props);
        return <Text {...props}>{content}</Text>;

      case 'img':
        return <Image src={props.src} {...props} />;

      case 'h1':
        return <Heading size={1} {...props}>{children}</Heading>;
      case 'h2':
        return <Heading size={2} {...props}>{children}</Heading>;
      case 'h3':
        return <Heading size={3} {...props}>{children}</Heading>;
      case 'h4':
        return <Heading size={4} {...props}>{children}</Heading>;
      case 'h5':
        return <Heading size={5} {...props}>{children}</Heading>;
      case 'h6':
        return <Heading size={6} {...props}>{children}</Heading>;

      case 'em':
        return <S type='italic' {...props}>{children}</S>;

      case 'del':
        return <S type='strikethrough' {...props}>{children}</S>;

      case 'strong':
        return <S type='bold' {...props}>{children}</S>;

      case 'blockquote':
        return <BlockQuote><Quote>{children}</Quote></BlockQuote>;

      case 'li':
        content = makeChildren(children, props);
        return <ListItem {...props}>{content}</ListItem>;

      case 'ul':
        return <List {...props}>{children}</List>;

      case 'ol':
        return <OrderedList {...props}>{children}</OrderedList>;

      case 'math':
        displayMode = props.display === 'inline' ? false : true;
        children = Array.isArray(children) ? children.join('') : children;
        return <Math displayMode={displayMode} {...props}>{children}</Math>;

      case 'htmlblock':
        content = Array.isArray(children) ? children.join('') : children;
        return <MarkdownHTMLElement content={content} {...props} />;

      /**
       * Special inline HTML treatment to embed the HTML as HTML-Nodes and not as escaped text.
       * Requires to use makeChildren function to get the transformed list of children.
       */
      case 'htmlinline':
        content = Array.isArray(children) ? children.join('') : children;
        return {
          type: 'htmlinline',
          content
        };

      default:
        return null; // now MDReactComponent is going to create the tag with React.createElement
    }

  },
  plugins: [
    Decorate,
    {
      plugin: mkitm,
      args: [{
        inlineOpen: '$',
        inlineClose: '$',
        blockOpen: '$$',
        blockClose: '$$',
        inlineRenderer: function (str) {
          return katex.renderToString(str, {
            displayMode: false,
            throwOnError: false
          });
        },
        blockRenderer: function (str) {
          return katex.renderToString(str, {
            displayMode: true,
            throwOnError: false
          });
        }
      }]
    }
  ],
  markdownOptions: {
    html: true,
    linkify: true
  }
};

/**
 * Transforms markdown text to React Nodes. Highlights code with highlight.js, uses KaTeX for math rendering.
 * Allows to use inline html inside paragraphs and list items.
 */
export function toMarkdownComponent(props) {
  return <MDReactComponent text={props.source} {...mdOptions} {...props} />;
}