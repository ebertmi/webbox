'use strict';

module.exports = {
  getForgotPasswordTemplate: function (route, token) {
    return `<!DOCTYPE html>
<html>
    <head>
        <title>Passwort zurücksetzen - Webbox</title>
        <meta charset="utf-8" />
    </head>
    <body>
        <h1>Passwort zurücksetzen - Webbox</h1>
        <p>
            Sie können Ihr Passwort mit einem Klick auf diesen <a href="${route}/${token}">Link</a> zurücksetzen.
        </p>
        <p>
          Sollten Sie diese E-Mail nicht angefordert haben, ignorieren Sie diese bitte.
    </body>
</html>`;
  }
};

