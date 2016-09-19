'use strict';

import markdown from 'markdown-it';
import React, { PropTypes } from 'react';
import isPlainObject from 'lodash/isPlainObject';
import assign from 'lodash/assign';
import reduce from 'lodash/reduce';
import zipObject from 'lodash/zipObject';
import sortBy from 'lodash/sortBy';
import compact from 'lodash/compact';
import camelCase from 'lodash/camelCase';
import isString from 'lodash/isString';
import fromPairs from 'lodash/fromPairs';


const DEFAULT_TAGS = {
  'html': 'wrapper'
};

/**
 * Markdown Node Rules to create a Markdown AST
 */
const DEFAULT_RULES = {
  image(token, attrs, children) {
    if (children.length) {
      attrs = assign({}, attrs, { alt: children[0] });
    }
    return [[token.tag, attrs]];
  },

  codeInline(token, attrs) {
    return [compact([token.tag, attrs, token.content])];
  },

  codeBlock(token, attrs) {
    return [['pre', compact([token.tag, attrs, token.content])]];
  },

  fence(token, attrs) {
    if (token.info) {
      const langName = token.info.trim().split(/\s+/g)[0];
      attrs = assign({}, attrs, { 'data-language': langName });
    }

    return [['pre', compact([token.tag, attrs, token.content])]];
  },

  hardbreak() {
    return [['br']];
  },

  softbreak(token, attrs, children, options) {
    return options.breaks ? [['br']] : '\n';
  },

  text(token) {
    return token.content;
  },

  htmlBlock(token, attrs) {
    return [compact(['htmlblock', attrs, token.content])];
  },

  htmlInline(token, attrs) {
    return [compact(['htmlinline', attrs, token.content])];
  },

  inline(token, attrs, children) {
    return children;
  },

  mathInline(token, attrs) {
    return [compact([token.tag, assign({}, attrs, { display: 'inline' }), token.content])];
  },

  mathBlock(token, attrs) {
    return [compact([token.tag, assign({}, attrs, { display: 'block' }), token.content])];
  },

  default(token, attrs, children, options, getNext) {
    if (token.nesting === 1 && token.hidden) {
      return getNext();
    }
    /* plugin-related */
    if (!token.tag) {
      return token.content;
    }

    if (token.info) {
      attrs = assign({}, attrs, { 'data-info': token.info.trim() });
    }

    /* plugin-related */
    return [compact([token.tag, attrs].concat((token.nesting === 1) && getNext()))];
  }
};

/**
 * Recursiv Markdown Tree converting function using the above rules and options.
 *
 * @param {any} tokens
 * @param {any} convertRules
 * @param {any} options
 * @returns
 */
function convertTree(tokens, convertRules, options) {
  function convertBranch(tkns, nested) {
    let branch = [];

    if (!nested) {
      branch.push('html');
    }

    function getNext() {
      return convertBranch(tkns, true);
    }

    let token = tkns.shift();
    while (token && token.nesting !== -1) {
      const attrs = token.attrs && fromPairs(sortBy(token.attrs, 0));
      const children = token.children && convertBranch(token.children.slice(), true);
      const rule = convertRules[camelCase(token.type)] || convertRules.default;

      branch = branch.concat(
        rule(token, attrs, children, options, getNext)
      );
      token = tkns.shift();
    }
    return branch;
  }

  return convertBranch(tokens, false);
}

function mdReactFactory(options={}) {
  const {
    onIterate,
    tags = DEFAULT_TAGS,
    presetName,
    markdownOptions,
    enableRules = [],
    disableRules = [],
    plugins = [],
    onGenerateKey = (tag, index) => `mdrct-${tag}-${index}`,
    ...rootElementProps
  } = options;

  // Create Markdown-it renderer with our custom options
  let md = markdown(markdownOptions || presetName)
    .enable(enableRules)
    .disable(disableRules);

  const convertRules = assign({}, DEFAULT_RULES, options.convertRules);

  md = reduce(plugins, (m, plugin) => (
    plugin.plugin
      ? m.use(plugin.plugin, ...plugin.args)
      : m.use(plugin)
    ), md
  );

  /**
   * Simple function to determine if we need to render children or not.
   *
   * @param {any} tag
   * @returns
   */
  function renderChildren(tag) {
    return ['img', 'hr', 'br'].indexOf(tag) < 0;
  }

  function iterateTree(tree, level=0, index=0) {
    let tag = tree.shift();
    const key = onGenerateKey(tag, index);

    let props = (tree.length && isPlainObject(tree[0]))
      ? assign(tree.shift(), { key })
      : { key };

    if (level === 0) {
      props = { ...props, ...rootElementProps };
    }

    const children = tree.map(
      (branch, idx) =>
        Array.isArray(branch)
          ? iterateTree(branch, level + 1, idx)
          : branch
    );

    tag = tags[tag] || tag;

    if (isString(props.style)) {
      props.style = zipObject(
        props.style.split(';')
        .map(prop => prop.split(':'))
        .map(keyVal => [camelCase(keyVal[0].trim()), keyVal[1].trim()])
      );
    }


    if ((typeof onIterate === 'function')) {
      let element = onIterate(tag, props, children, level);
      if (element) {
        return element;
      }
    }
    return React.createElement(tag, props, renderChildren(tag) ? children : undefined);
  }

  return function(text) {
    const tree = convertTree(md.parse(text, {}), convertRules, md.options);
    return iterateTree(tree);
  };
}

/**
 * MarkdownReact Component, that does the rendering
 */
class MDReactComponent extends React.Component {
  render () {
    const { text, ...propsWithoutText } = this.props;
    return mdReactFactory(propsWithoutText)(text);
  }
}

MDReactComponent.propTypes = {
  text: PropTypes.string.isRequired,
  onIterate: PropTypes.func,
  onGenerateKey: PropTypes.func,
  tags: PropTypes.object,
  presetName: PropTypes.string,
  markdownOptions: PropTypes.object,
  enableRules: PropTypes.array,
  disableRules: PropTypes.array,
  convertRules: PropTypes.object,
  plugins: PropTypes.array,
  className: PropTypes.string
};

export default MDReactComponent;
export { mdReactFactory as mdReact };