/**
 * Markdown Rendering Base Class.
 * Allows rendering Markdown to HTML with custom extensions:
 * - Uses highlight.js for code highlighting
 */
import md from 'markdown-it';
import katex from 'katex';
import hljs from 'highlight.js';

import Decorate from 'markdown-it-decorate';
import MarkdownMath from 'markdown-it-math';
import Anchor from './markdown-it-anchor';
import MarkdownContainer from './markdown-it-container';

const COPY_BUTTON = `<div class="course-clipboard">
<span class="btn-clipboard" data-event="code.copy" title data-original-title="In die Zwischenablage legen.">Kopieren</span>
</div>`;

const LAUNCH_SOURCEBOX_BUTTON = '';/*`<div class="course-sourcebox">
<span class="btn-sourcebox" title data-original-title="Launch with SourceBox">SourceBox</span>
</div>`;*/

var defaults = {
  html: true,
  linkify: true,
  highlight: function (str, lang) {
    // ToDo: add proper ace mode to highlight js mode translation or abstract everything

    // handle c/cpp case of ace editor
    if (lang && lang === "c_cpp") {
      lang = "cpp";
    }

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
markdownit.use(Decorate);
markdownit.use(Anchor);

// render math with katex
markdownit.use(MarkdownMath, {
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

markdownit.renderer.rules.fence = FENCE;

// Now add the spoiler container plugin
markdownit.use(MarkdownContainer, 'spoiler', {

  validate: function(params) {
    return params.trim().match(/^spoiler\s+(.*)$/);
  },

  render: function (tokens, idx) {
    var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);

    if (tokens[idx].nesting === 1) {
      // opening tag
      return '<details><summary>' + markdownit.utils.escapeHtml(m[1]) + '</summary>\n';

    } else {
      // closing tag
      return '</details>\n';
    }
  }
});

export default {
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
