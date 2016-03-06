'use strict';

module.exports = {
  getVerificationTemplate: function (route, token) {
    return `<!DOCTYPE html>
<html>
    <head>
        <title>Willkommen zu Webbox - Hochschule Coburg</title>
        <meta charset="utf-8" />
    </head>
    <body>
        <h1>Willkommen zur Webbox - Hochschule Coburg</h1>
        <p>
            Sie können Ihre Registrierung mit einem Klick auf diesen <a href="${route}/${token}">Link</a> abschließen.
        </p>
    </body>
</html>`;
  },
  getResendVerificationTemplate: function (route, token) {

  }
};

