'use strict';
/**
 * Static Controllers for serving static and media content.
 * The /static and /media handlers rely on the Inert plugin
 * for serving static contents from disk.
 */

module.exports = {
  public: {
    directory: {
      path: './public/',
      redirectToSlash: true,
      index: false,
    }
  },
  media: {
    directory: {
      path: './media/',
      redirectToSlash: true,
      index: false
    }
  }
};