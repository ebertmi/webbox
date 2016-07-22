/**
 * Media API
 */
import { commonErrorHandler, checkStatus, getDefaultHeaders, parseJSON } from './utils';

const MEDIA_UPLIOD_FROMDATA_FILE = 'imageFile';
const MEDIA_UPLIOD_FROMDATA_DOCUMENT = 'document';
const MEDIA_UPLOAD_METHOD = 'POST';

export const MediaAPI = {
  getImages(params) {
    return fetch(`/images/${params.document}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: getDefaultHeaders(),
    })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      return data;
    })
    .catch(commonErrorHandler);
  },
  ImageUploader(files=[], document, onError, onProgress, onDone) {
    if (files.length === 0) {
      onError.call(null, 'Keine Dateien zum Hochladen');
      return;
    }

    let message;

    this.xhr = new XMLHttpRequest();
    this.xhr.open(MEDIA_UPLOAD_METHOD, '/mediaupload', true);

    // set headers
    const headers = getDefaultHeaders();
    if (headers['Content-Type']) {
      delete headers['Content-Type'];
    }

    for (let key in headers) {
      if( headers.hasOwnProperty( key ) ) {
        this.xhr.setRequestHeader(key, headers[key]);
      }
    }

    this.xhr.addEventListener('error', err => {
      message = err.status || 'Fehler beim Hochladen';
      onError.call(null, message);
    });

    this.xhr.addEventListener('progress', event => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total * 100 | 0);
        onProgress.call(null, progress);
      }
    });

    this.xhr.addEventListener('load', event => {
      let result = {};
      if (this.xhr.getResponseHeader("content-type") && ~this.xhr.getResponseHeader("content-type").indexOf("application/json")) {
        try {
          result = JSON.parse(this.xhr.responseText);
        } catch (_error) {
          result = {
            error: "Invalid JSON response from server."
          };
        }
      }

      if (this.xhr.status === 200) {
        result.success = true;
      } else {
        result.success = false;
        result.statusCode = this.xhr.status;
        result.error = this.xhr.statusMessage;
      }

      onDone.call(null, event, result);
    });

    let formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append(MEDIA_UPLIOD_FROMDATA_FILE, files[i], files[i].name);
    }

    formData.append(MEDIA_UPLIOD_FROMDATA_DOCUMENT, document);
    formData.append('crumb', headers['X-CSRF-Token']); // make our authentication happy

    this.xhr.send(formData);

  }
};
