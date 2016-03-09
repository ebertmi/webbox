require('scss/course/course');

const Stickyfill = require('exports?Stickyfill!Stickyfill/src/stickyfill');
var anchors = require('exports?anchors!anchor-js/anchor');
const Contents = require('contents');

const sidenav = document.querySelector('.wb-sidenav:first-child');
Stickyfill.add(sidenav);


anchors.options.placement = 'left';
anchors.add('.course h1, .course h2, .course h3');

// generate TOC
const contents = Contents({
  articles: document.querySelectorAll('.course h1, .course h2, .course h3, .course h4')
});

// Append the generated list element (table of contents) to the container.
sidenav.appendChild(contents.list());

// Attach event listeners:
contents.eventEmitter().on('change', function (event) {
  console.log('User has navigated to a new section of the page.', event);
});

// dropdown support
import './util/dropdown.native';