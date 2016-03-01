require('scss/index');

var Terminal = require('term.js');
var Dropzone = require("dropzone");

// Dropzone config for media upload
Dropzone.options.mediaupload = {
  paramName: "imageFile", // The name that will be used to transfer the file
  init:function () {
    this.on('success', function (result) {
      console.log(JSON.parse(result.xhr.response));
    });
  }
};
