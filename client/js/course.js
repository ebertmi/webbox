require('scss/course/course');

const Stickyfill = require('exports?Stickyfill!Stickyfill/src/stickyfill');
var anchors = require('exports?anchors!anchor-js/anchor');

const sidenav = document.querySelectorAll('.nav-secondary');
Stickyfill.add(sidenav[0]);

anchors.options.placement = 'left';
anchors.add();