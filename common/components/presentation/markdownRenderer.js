import React from 'react';
import MDReactComponent from './MDReactComponent';
import { S, Code, BlockQuote, Quote, Heading, Image, Link, Text, ListItem } from "spectacle/lib/index";
import Math from './Math';
import MarkdownHTMLElement from './MarkdownHTMLElement';
import Highlight from './Highlight';
import katex from 'katex';
import mkitm from 'markdown-it-math';
import isString from 'lodash/isString';

export const mdOptions = {
  onIterate: function (tag, props, children) {
    let lang;
    let content;
    let displayMode;
    let source;

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
        console.log('p', children);
        return <Text {...props}>{children}</Text>;

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
        return <ListItem {...props}>{children}</ListItem>;

      case 'math':
        displayMode = props.display === 'inline' ? false : true;
        children = Array.isArray(children) ? children.join('') : children;
        return <Math displayMode={displayMode} {...props}>{children}</Math>;

      case 'htmlblock':
        content = Array.isArray(children) ? children.join('') : children;
        return <MarkdownHTMLElement content={content} {...props} />;

      default:
        return null; // now MDReactComponent is going to create the tag with React.createElement
    }

  },
  plugins: [
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

export function toMarkdownComponent(props) {
  return <MDReactComponent text={props.source} {...mdOptions} {...props} />;
}