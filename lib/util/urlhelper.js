'use strict';

/**
 * Simple url helpers to create urls from path
 */

module.exports = {
  join: function () {
    var re1 = new RegExp('^\\/|\\/$','g');
    var elts = Array.prototype.slice.call(arguments);
    return elts.map(function (element) {
      return element.replace(re1,"").replace(/\\/g,"/");
    }).join('/');
  }
};