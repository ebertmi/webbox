require('scss/index');

// polyfills
import 'babel-polyfill';
import 'exports?fetch!whatwg-fetch/fetch';
import { Typer } from './util/_typer';


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



var typerSpan = document.getElementById('welcome-msg-typer');
var typerOtions = { erase: 90, type: 120, break: 2000 };
if (typerSpan != null) {
  var player = Typer(typerSpan, typerOtions, ['Welcome to trycoding.io!', 'Lerne Python', 'Lerne C', 'und noch einiges dazu!', 'powered by Sourcebox']);

  setTimeout(player.play, 2000);
}