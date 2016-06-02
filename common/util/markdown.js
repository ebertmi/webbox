/**
 * Markdown Rendering Base Class.
 * Allows rendering Markdown to HTML with custom extensions:
 * - Uses highlight.js for code highlighting
 */
const md = require('markdown-it');
const katex = require('katex');
/*const Promise = require('bluebird');*/
const hljs = require('highlight.js');


const COPY_BUTTON = `<div class="course-clipboard">
<span class="btn-clipboard" data-event="code.copy" title data-original-title="Copy to clipboard">Copy</span>
</div>`;

const LAUNCH_SOURCEBOX_BUTTON = '';/*`<div class="course-sourcebox">
<span class="btn-sourcebox" title data-original-title="Launch with SourceBox">SourceBox</span>
</div>`;*/

var defaults = {
  html: true,
  linkify: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
};

// create markdown-it instance
const markdownit = md(defaults);

/**
 * Custom fence renderer, that allows use to put buttons in the upper right corner.
 */
const FENCE = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];
  var info = token.info ? markdownit.utils.unescapeAll(token.info).trim() : '';
  var langName = '';
  var highlighted;

  if (info) {
    langName = info.split(/\s+/g)[0];
    token.attrJoin('class', options.langPrefix + langName);
  }

  if (options.highlight) {
    highlighted = options.highlight(token.content, langName) || markdownit.utils.escapeHtml(token.content);
  } else {
    highlighted = markdownit.utils.escapeHtml(token.content);
  }

  if (highlighted.indexOf('<pre') === 0) {
    return highlighted + '\n';
  }

  return LAUNCH_SOURCEBOX_BUTTON + COPY_BUTTON + '<figure class="hljs"><pre class="hljs"><code' + slf.renderAttrs(token) + '>'
        + highlighted
        + '</code></pre></figure>\n';
};

// add plugins
markdownit.use(require('markdown-it-decorate'));

// this wraps the content into section elements after each heading
markdownit.use(require('markdown-it-header-sections'));

// render math with katex
markdownit.use(require('markdown-it-math'), {
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

markdownit.renderer.rules.fence = FENCE;

module.exports = {
  render: function (str) {
    return new Promise(function (resolve, reject) {
      try {
        resolve(markdownit.render(str));
      } catch (error) {
        reject(error);
      }
    });
  }
};
