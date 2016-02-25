'use strict';
/**
 * Markdown Rendering Base Class.
 * Allows rendering Markdown to HTML with custom extensions:
 * - Uses highlight.js for code highlighting
 */
const md = require('markdown-it');
const hljs = require('highlight.js');
const katex = require('katex');

const defaults = {
  html: true,
  langPrefix: 'hljs ',
  linkify: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(lang, str, true).value +
               '</code></pre>';
      } catch (__) {}
    }

    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
};

// create markdown-it instance
const markdownit = md(defaults);

// add plugins
markdownit.use(require('markdown-it-decorate'));

// this wraps the content into section elements after each heading
markdownit.use(require('markdown-it-header-sections'));

// render math with katex
markdownit.use(require('markdown-it-math'), {
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
});

markdownit.use(require('markdown-it-hashtag'));

// custom override for hashtag plugin for our embeds
markdownit.renderer.rules.hashtag_open  = function (tokens, idx) {
  var tagName = tokens[idx].content.toLowerCase();
  return '<a href="/tags/' + tagName + '" class="tag">';
};

markdownit.renderer.rules.hashtag_text  = function (tokens, idx) {
  return '#' + tokens[idx].content;
};

markdownit.renderer.rules.hashtag_close = function () { return '</a>'; };

module.exports.render = function (str) {
  return new Promise(function (resolve, reject) {
    resolve(markdownit.render(str));
  });
};
