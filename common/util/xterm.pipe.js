(function (pipe) {
  if (typeof exports === 'object' && typeof module === 'object') {
    /*
     * CommonJS environment
     */
    module.exports = pipe(require('xterm'));
  } else if (typeof define == 'function') {
    /*
     * Require.js is available
     */
    define(['xterm'], pipe);
  } else {
    /*
     * Plain browser environment
     */
    pipe(this.Xterm);
  }
})(function (Xterm) {
  var exports = {};

  Xterm.prototype.pipe = function (dest) {
    var src = this;
    var ondata;
    var onerror;
    var onend;

    function unbind() {
      src.removeListener('data', ondata);
      src.removeListener('error', onerror);
      src.removeListener('end', onend);
      dest.removeListener('error', onerror);
      dest.removeListener('close', unbind);
    }

    src.on('data', ondata = function(data) {
      dest.write(data);
    });

    src.on('error', onerror = function(err) {
      unbind();
      if (!this.listeners('error').length) {
        throw err;
      }
    });

    src.on('end', onend = function() {
      dest.end();
      unbind();
    });

    dest.on('error', onerror);
    dest.on('close', unbind);

    dest.emit('pipe', src);

    return dest;
  };

  return exports;
});