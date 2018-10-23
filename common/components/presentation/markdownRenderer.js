/**
 * The Markdown Renderer uses the underlying MDReactComponent class to render markdown.
 * We use special options and functions to turn the Markdown AST Nodes into React components.
 * In our case we turn them into Spectacle Presentation Framework Components. Additionally,
 * we've added the support for inline HTML nodes and classes.
 */

import React from 'react';
import Debug from 'debug';
import katex from 'katex';
import mkitm from 'markdown-it-math';
import isString from 'lodash/isString';
import { S, Code, BlockQuote, Quote, Heading, Image, Link, Text, ListItem, List, Table, TableHeader, TableBody, TableRow, TableHeaderItem, TableItem } from 'spectacle';
import Decorate from 'markdown-it-decorate';
import MarkdownContainer from '../../util/markdown-it-container';

import MDReactComponent from './MDReactComponent';
import Math from './Math';
import Spoiler from './Spoiler';
import MarkdownHTMLElement from './MarkdownHTMLElement';
import Highlight from './Highlight';
import DefaultWrapper from './DefaultWrapper';

const debug = Debug('webbox:presentation:markdownRenderer');

const EMPTY_HTML_ELEMENTS = {
  'area': true,
  'base': true,
  'br': true,
  'col': true,
  'colgroup': false,
  'command': true,
  'embed': true,
  'hr': true,
  'img': true,
  'input': true,
  'keygen': true,
  'link': true,
  'meta': true,
  'param': true,
  'source': true,
  'track': true,
  'wbr': true
};

function regexIndexOf (str, regex, startpos=0) {
  const indexOf = str.substring(startpos).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos)) : indexOf;
}

/**
 * Transforms any inline HTML from text to real HTML (react)
 */
function makeChildren(children, props, options) {
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
   * WARNING: This will fail if somebody injects errornous HTML code, which prevents to render the node at all.
   */

  // ToDo: Handle tags without children: https://github.com/component/domify/blob/master/index.js
  // ToDo: Check if we something left on the stack and print an error message, that the user has input invalid HTML

  for (let child of children) {
    if (child.type && child.type === 'htmlinline') {
      let groups = /<([\w:]+)/.exec(child.content);
      let elementTag = groups && groups.length === 2 ? groups[1] : null;
      let isEmptyElement = EMPTY_HTML_ELEMENTS[elementTag] === true;

      // Skip forbidden tags
      if (isString(elementTag) && options.escapeTags[elementTag.toLowerCase()] === true) {
        continue;
      }

      // 1. Is opening Tag?
      if (regexIndexOf(child.content, /<\s*\/.*>/) < 0 && !isEmptyElement) {
        openTags += 1;
        htmlContent.push(child.content);
      } else if (isEmptyElement) {
        // when we deal with an empty element, just add this and proceed
        let {key, ...rest} = props; // Extract key from props
        keyCounter += 1;
        result.push(<MarkdownHTMLElement key={`${key}-inlinehtml-${keyCounter}`} {...rest} displayMode={false} content={child.content} />);
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

/**
 * Markdown Options that are passed to MDReactComponent and then to markdown-it
 */
export const mdOptions = {
  onIterate: function onIterate(tag, props, children, level, options) {
    /**
     * The onIterate function is doing the actual work. It transforms the Mardown Nodes
     * to React Nodes and passes in the props and children.
     */
    let lang;
    let content;
    let displayMode;
    let source;
    let matches;
    let summary;

    if (props.class != null) {
      props.className = props.class;
      delete props.class;
    }

    // Maybe we need here a more generic solution with a simple mapping
    if (props['max-width']) {
      if (props.style == null) {
        props.style = {};
      }

      props.style.maxWidth = props['max-width'];
    }

    // Remove propagated source prop
    if (props.source) {
      delete props.source;
    }

    switch (tag) {
      case 'a':
        content = makeChildren(children, props, options.htmlOptions);
        return <Link href={props.href} target="_blank" {...props}>{content}</Link>;

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
        return <Highlight mode={lang} code={source} {...props} />;

      case 'p':
        content = makeChildren(children, props, options.htmlOptions);
        return <Text lineHeight={1.2} {...props}>{content}</Text>;

      case 'img':
        return <Image src={props.src} {...props} />;

      case 'h1':
        content = makeChildren(children, props, options.htmlOptions);
        return <Heading size={1} {...props}>{content}</Heading>;
      case 'h2':
        content = makeChildren(children, props, options.htmlOptions);
        return <Heading size={2} {...props}>{content}</Heading>;
      case 'h3':
        content = makeChildren(children, props, options.htmlOptions);
        return <Heading size={3} {...props}>{content}</Heading>;
      case 'h4':
        content = makeChildren(children, props, options.htmlOptions);
        return <Heading size={4} {...props}>{content}</Heading>;
      case 'h5':
        content = makeChildren(children, props, options.htmlOptions);
        return <Heading size={5} {...props}>{content}</Heading>;
      case 'h6':
        content = makeChildren(children, props, options.htmlOptions);
        return <Heading size={6} {...props}>{content}</Heading>;

      case 'em':
        content = makeChildren(children, props, options.htmlOptions);
        return <S type="italic" {...props}>{content}</S>;

      case 'del':
        content = makeChildren(children, props, options.htmlOptions);
        return <S type="strikethrough" {...props}>{content}</S>;

      case 'strong':
        content = makeChildren(children, props, options.htmlOptions);
        return <S type="bold" {...props}>{content}</S>;

      case 'blockquote':
        content = makeChildren(children, props, options.htmlOptions);
        return <BlockQuote {...props}><Quote>{content}</Quote></BlockQuote>;

      case 'li':
        content = makeChildren(children, props, options.htmlOptions);
        return <ListItem {...props}>{content}</ListItem>;

      case 'ul':
        return <List {...props}>{children}</List>;

      case 'ol':
        return <List ordered {...props}>{children}</List>;

      case 'math':
        displayMode = props.display === 'inline' ? false : true;
        children = Array.isArray(children) ? children.join('') : children;
        return <Math displayMode={displayMode} {...props}>{children}</Math>;

      /* Spoiler (markdown-it container) rule */
      case 'div':
        matches = props['data-info'].trim().match(/^spoiler\s+(.*)$/);

        if (matches != null && matches.length === 2) {
          summary = matches[1];
        } else {
          // no matches, so just use createElement
          return null;
        }

        content = makeChildren(children, props, options.htmlOptions);
        return <Spoiler summary={summary} {...props}>{content}</Spoiler>;

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

      case 'table':
        return <Table {...props}>{children}</Table>;

      case 'thead':
        return <TableHeader {...props}>{children}</TableHeader>;
      case 'tbody':
        return <TableBody {...props}>{children}</TableBody>;
      case 'tr':
        return <TableRow {...props}>{children}</TableRow>;
      case 'th':
        content = makeChildren(children, props, options.htmlOptions);
        return <TableHeaderItem {...props}>{content}</TableHeaderItem>;
      case 'td':
        content = makeChildren(children, props, options.htmlOptions);
        return <TableItem {...props}>{content}</TableItem>;

      case 'wrapper':
        return <DefaultWrapper {...props}>{children}</DefaultWrapper>;

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
    },
    {
      plugin: MarkdownContainer,
      args: [
        'spoiler',
        {
          validate: function(params) {
            //console.log('spoiler validate function', params);
            return params.trim().match(/^spoiler\s+(.*)$/);
          },
          render: function (tokens, idx) {
            //console.log('spoiler render function');
            var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);

            if (tokens[idx].nesting === 1) {
              // opening tag
              return '<details><summary>' + m[1] + '</summary>\n';

            } else {
              // closing tag
              return '</details>\n';
            }
          }
        }
      ]
    }
  ],
  markdownOptions: {
    html: true,
    linkify: true
  },
  htmlOptions: {
    escapeTags: {
      script: true
    }
  }
};

/**
 * Transforms markdown text to React Nodes. Highlights code with highlight.js, uses KaTeX for math rendering.
 * Allows to use inline html inside paragraphs and list items.
 *
 * @param {object} props to use
 *
 * @returns {MDReactComponent} markdown as a tree of markdown components
 */
export function toMarkdownComponent(props) {
  return <MDReactComponent text={props.source} {...mdOptions} {...props} />;
}